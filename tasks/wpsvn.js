/*
 * grunt-wp-svn
 * https://github.com/axisthemes/grunt-wp-svn
 *
 * Copyright (c) 2014 AxisThemes
 * Licensed under the MIT license.
 */

'use strict';

var shell = require( 'shelljs' ), inquirer = require( 'inquirer' );

module.exports = function( grunt ) {

	var path = require( 'path' );
	var exec = require( 'child_process' ).exec();

	grunt.registerMultiTask( 'wpsvn', 'Deploy a Git repo to the WordPress SVN repo.', function() {
		var cmd, done = this.async();

		var options = this.options({
			svn_repo: 'http://plugins.svn.wordpress.org/{plugin-slug}',
			svn_user: false,
			build_dir: false,
			assets_dir: false,
			plugin_slug: false,
			max_buffer: 200*1024
		});

		var pkg = grunt.file.readJSON( 'package.json' );
		var questions = [];

		if ( ! options.plugin_slug ) {
			grunt.fail.fatal( 'Plug-in slug is missing.' );
		}

		if ( ! options.deploy_dir ) {
			grunt.fail.fatal( 'Deploy directory not found.' );
		}

		if ( ! options.svn_username ) {
			questions.push({
				type: 'input',
				name: 'svn_username',
				message: 'What\'s your SVN username?'
			});
		}

		inquirer.prompt( questions, function( answers ) {

			// Set up slug, main file, readme file and paths.
			var slug        = options.plugin_slug;
			var svnpath     = './tmp/' + slug;
			var deploy_path = options.deploy_dir.replace( /\/?$/, '/' ); // trailingslash
			var plugin_file = deploy_path + slug + '.php';
			var readme_file = deploy_path + 'readme.txt';

			// SVN User and Repository URL
			var svnuser = options.svn_username || answers.svn_username;
			var svnrepo = options.svn_repository.replace( '{plugin-slug}', slug );

			// Try to find readme.txt
			if ( ! grunt.file.exists( readme_file ) ) {
				grunt.fail.warn( 'readme.txt file not found at ' + readme_file );
			}

			// Try to find main plug-in file
			if ( ! grunt.file.exists( plugin_file ) ) {
				grunt.fail.warn( 'Main' + plugin_file + 'file not found.' );
			}

			// Get Versions:
			var readme = grunt.file.read( readme_file );
			var plugin = grunt.file.read( plugin_file );
			var readme_ver = readme.match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );
			var plugin_ver = plugin.match( new RegExp( '^[ \t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );

			// Version Compare
			if ( version_compare( plugin_ver[1], readme_ver[1] ) ) {
				grunt.log.warn( 'Readme version: ' + readme_ver[1] );
				grunt.log.warn( 'Plugin version: ' + plugin_ver[1] );
				grunt.fail.warn( 'Plugin and Readme version do not match.' );
			}

			// Set variables
			var version = plugin_ver[1];
			var message = 'Tagging ' + version;

			// Clean temp
			cmd = ( 'rm -fr ' + svnpath );

			// Subversion checkout
			grunt.log.writeln( 'Subversion checkout...' );

		});
	});

	// Version Compare
	var version_compare = function( a, b ) {
		if ( typeof a + typeof b !== 'stringstring' ) {
			return false;
		}

		var a = a.split( '.' ),	b = b.split( '.' );
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
