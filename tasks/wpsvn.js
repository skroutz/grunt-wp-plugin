/*
 * grunt-wp-svn
 * https://github.com/axisthemes/grunt-wp-svn
 *
 * Copyright (c) 2014 AxisThemes
 * Licensed under the MIT license.
 */

'use strict';

var inquirer = require( 'inquirer' );

module.exports = function( grunt ) {

	var path = require( 'path' );
	var exec = require( 'child_process' ).exec, child;

	grunt.registerMultiTask( 'wpsvn', 'Deploy a Git repo to the WordPress SVN repo.', function() {
		var done = this.async();

		var options = this.options({
			svn_repo: 'http://plugins.svn.wordpress.org/{plugin-slug}',
			svn_user: false,
			deploy_dir: false,
			assets_dir: false,
			plugin_slug: false,
			max_buffer: 200*1024
		});

		var questions = [];

		if ( ! options.svn_user ) {
			questions.push({
				type: 'input',
				name: 'svn_username',
				message: 'What\'s your SVN username?'
			});
		}

		if ( ! options.deploy_dir ) {
			grunt.fail.fatal( 'Deploy directory not found.' );
		}

		if ( ! options.plugin_slug ) {
			grunt.fail.fatal( 'Plug-in slug is missing, stupid.' );
		}

		inquirer.prompt( questions, function( answers ) {

			// Setup subversion user, tmp path and repo uri
			var svn_user = options.svn_user || answers.svn_username;
			var svn_path = path.resolve( 'tmp/' + options.plugin_slug );
			var svn_repo = options.svn_repo.replace( '{plugin-slug}', options.plugin_slug );

			// Setup deployment path, Plug-in and Readme files
			var deploy_path = path.resolve( options.deploy_dir );
			var readme_file = deploy_path + '/readme.txt';
			var plugin_file = deploy_path + '/' + options.plugin_slug + '.php';

			// Check if Readme and Plug-in file exists
			if ( ! grunt.file.exists( readme_file ) ) {
				grunt.fail.warn( 'Readme file "' + readme_file + '" not found.' );
			} else if ( ! grunt.file.exists( plugin_file ) ) {
				grunt.fail.warn( 'Plug-in file "' + plugin_file + '" not found.' );
			}

			// Get Versions:
			var readme_ver = grunt.file.read( readme_file ).match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );
			var plugin_ver = grunt.file.read( plugin_file ).match( new RegExp( '^[ \t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );

			// Version Compare
			if ( version_compare( readme_ver[1], plugin_ver[1] ) ) {
				grunt.log.warn( 'Readme version: ' + readme_ver[1] );
				grunt.log.warn( 'Plugin version: ' + plugin_ver[1] );
				grunt.fail.warn( 'Readme and Plug-in file version do not match.' );
			}

			// Set plug-in release credentials
			var plugin_version = plugin_ver[1];
			var commit_message = 'Tagging ' + plugin_version;

			/**
			 * Real work begins :)
			 */
			grunt.log.writeln( 'Check if Subversion dir exists...' );

			if ( grunt.file.isDir( svn_path ) ) {
				grunt.log.ok( 'Subversion dir exists.' );
			} else {
				grunt.log.ok( 'Subversion dir doesn\'t exists.' );

				grunt.log.writeln( 'Subversion Checkout...' );

				grunt.util.spawn({
					cmd: 'svn',
					args: [ 'co', svn_repo, svn_path ],
					opts: { stdio: 'inherit' }
				}, function( error, result, code ) {
					grunt.log.ok( 'Subversion checkout done.' );
				});
			}
		});
	});

	// Version compare
	var version_compare = function( a, b ) {
		if ( typeof a + typeof b !== 'stringstring' ) {
			return false;
		}

		a = a.split( '.' );
		b = b.split( '.' );

		for ( var i = 0; i < Math.max( a.length, b.length ); i++ ) {
			if ( ( a[i] && ! b[i] && parseInt( a[i], 10 ) > 0 ) || ( parseInt( a[i], 10 ) > parseInt( b[i], 10 ) ) ) {
				return 1;
			} else if ( ( b[i] && ! a[i] && parseInt( b[i], 10 ) > 0 ) || ( parseInt( a[i], 10 ) < parseInt( b[i], 10 ) ) ) {
				return -1;
			}
		}

		return 0;
	};
};
