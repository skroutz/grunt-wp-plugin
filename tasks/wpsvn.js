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

			// Setup subversion tmp path, user and repo uri
			var svn_path = '/tmp/' + options.plugin_slug;
			var svn_user = options.svn_user || answers.svn_username;
			var svn_repo = options.svn_repo.replace( '{plugin-slug}', options.plugin_slug );

			// Setup deployment path, Plug-in and Readme files
			var deploy_path = options.deploy_dir.replace( /\/?$/, '/' ); // trailingslash
			var plugin_file = deploy_path + options.plugin_slug + '.php';
			var readme_file = deploy_path + 'readme.txt';

			// Check if Plug-in and Readme file exists
			if ( ! grunt.file.exists( plugin_file ) ) {
				grunt.fail.warn( 'Plug-in file "' + plugin_file + '" not found.' );
			} else if ( ! grunt.file.exists( readme_file ) ) {
				grunt.fail.warn( 'Readme file "' + readme_file + '" not found.' );
			}

			// Get Versions:
			var plugin_ver = grunt.file.read( plugin_file ).match( new RegExp( '^[ \t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );
			var readme_ver = grunt.file.read( readme_file ).match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );

			// Version Compare
			if ( version_compare( plugin_ver[1], readme_ver[1] ) ) {
				grunt.log.warn( 'Plugin version: ' + ( 'v' + plugin_ver[1] ).cyan );
				grunt.log.warn( 'Readme version: ' + ( 'v' + readme_ver[1] ).cyan );
				grunt.fail.warn( 'Main Plug-in and Readme file version do not match.' );
			}

			// Set plug-in release credentials
			var plugin_version = plugin_ver[1];
			var commit_message = 'Tagging v' + plugin_version;

			// Clean subversion temp directory
			child = exec( 'rm -fr ' + svn_path );

			// Subversion checkout repository
			grunt.log.writeln( 'Checking out: ' + svn_repo.cyan );

			child = exec( 'svn co ' + svn_repo + ' ' + svn_path, { maxBuffer: options.max_buffer }, function( error, stdout, stderr ) {
				grunt.verbose.writeln( stdout );
				grunt.verbose.writeln( stderr );

				if ( error !== null ) {
					grunt.fail.fatal( 'Checkout of "' + svn_repo + '" unsuccessful: ' + error );
				}

				grunt.log.writeln( 'Check out complete.' );

				if ( grunt.file.exists( svn_path + '/tags/' + plugin_version ) ) {
					grunt.fail.warn( 'Tag ' + plugin_version + ' already exists.' );
				}

				// Clean subversion trunk directory
				grunt.log.writeln( 'Subversion trunk cleaned.' );
				exec( 'rm -fr ' + svn_path + '/trunk/*' );

				// Propset subversion trunk Ignorance
				// grunt.log.writeln( 'Subversion file excluded.' );
				exec( 'svn propset svn:ignore ".git .gitignore *.md *.sh" "' + svn_path + '/trunk/"' );

				// Copy deploy to subversion trunk directory
				grunt.log.writeln( 'Copying deploy directory: ' + deploy_path.cyan + ' -> ' + ( svn_path + '/trunk' ).cyan );
				copy_directory( deploy_path, svn_path + '/trunk/' );
			});
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

	// Copy directory
	var copy_directory = function( src_dir, dest_dir ) {
		// Ensure directory has trailingslash
		if ( src_dir.substr(-1) !== '/' ) {
			src_dir = src_dir + '/';
		}

		grunt.file.expand({ 'expand': true, 'cwd': src_dir }, '**/*' ).forEach( function( src ) {
			var dest = unixifyPath( path.join( dest_dir, src ) );
			if ( grunt.file.isDir( src_dir + src ) ) {
				grunt.file.mkdir( dest );
			} else {
				grunt.file.copy( src_dir + src, dest );
			}
		});
	};

	var unixifyPath = function( filepath ) {
		if ( process.platform === 'win32' ) {
		  return filepath.replace( /\\/g, '/' );
		} else {
		  return filepath;
		}
	};
};
