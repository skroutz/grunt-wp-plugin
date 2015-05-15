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
		var cmd, done = this.async();

		var options = this.options({
			svn_repo: 'http://plugins.svn.wordpress.org/{plugin-slug}',
			svn_user: false,
			deploy_dir: false,
			assets_dir: false,
			plugin_slug: false,
			max_buffer: 200*1024
		});

		var pkg = grunt.file.readJSON( 'package.json' );
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

			// Set up slug, main file, readme file and paths.
			var slug        = options.plugin_slug;
			var svnpath     = './tmp/' + slug;
			var deploy_path = options.deploy_dir.replace( /\/?$/, '/' ); // trailingslash
			var plugin_file = deploy_path + slug + '.php';
			var readme_file = deploy_path + 'readme.txt';

			// SVN User and Repository URI
			var svnuser = options.svn_user || answers.svn_username;
			var svnrepo = options.svn_repo.replace( '{plugin-slug}', slug );

			// Try to find Readme file
			if ( ! grunt.file.exists( readme_file ) ) {
				grunt.fail.warn( 'Readme file "' + readme_file + '" not found.' );
			}

			// Try to find plug-in file
			if ( ! grunt.file.exists( plugin_file ) ) {
				grunt.fail.warn( 'Plug-in file "' + plugin_file + '" not found.' );
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
			child = exec( 'rm -fr ' + svnpath );

			// Subversion checkout repository
			grunt.log.writeln( 'Subversion checkout: ' + svnrepo.cyan );

			child = exec( 'svn co ' + svnrepo + ' ' + svnpath, { maxBuffer: options.max_buffer }, function( error, stdout, stderr ) {
				grunt.verbose.writeln( stdout );
				grunt.verbose.writeln( stderr );

				if ( error !== null ) {
					grunt.fail.fatal( 'Subversion checkout of "' + svnrepo + '" unsuccessful: ' + error );
				}

				grunt.log.writeln( 'Subversion checkout done.' );

				if ( grunt.file.exists( svnpath + '/tags/' + version ) ) {
					grunt.fail.warn( 'Tag ' + version + ' already exists.' );
				}

				// Clean trunk
				grunt.log.writeln( 'Subversion trunk cleaned.' );
				exec( 'rm -fr ' + svnpath + '/trunk/*' );

				// Subversion Ignorance
				// grunt.log.writeln( 'Subversion file excluded.' );
				exec( 'svn propset svn:ignore ".git .gitignore *.md *.sh" "' + svnpath + '/trunk/"' );
			});

		});
	});

	// Version Compare
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
