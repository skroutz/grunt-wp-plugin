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
			plugin_slug: false
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

			// Set deployment path, Plug-in and Readme files
			var deploy_path = path.resolve( options.deploy_dir );
			var plugin_file = deploy_path + '/' + options.plugin_slug + '.php';
			var readme_file = deploy_path + '/readme.txt';

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

			/**
			 * Real work begins :)
			 */
			var svn_user = options.svn_user || answers.svn_username;
			var svn_path = path.resolve( path.join( 'tmp', options.plugin_slug ) );
			var svn_repo = options.svn_repo.replace( '{plugin-slug}', options.plugin_slug );

			// Set subversion tags, trunk and assets path
			var svn_tags   = svn_path + '/tags/' + plugin_ver[1];
			var svn_trunk  = svn_path + '/trunk';
			var svn_assets = svn_path + '/assets';

			var svnArgs = function( args, username ) {
				if ( username ) {
					args.push( '--username=' + username );
				}

				return args;
			};

			var svnUpdate = function() {
				// Subversion update
				grunt.log.writeln( 'Subversion update...' );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( ['up'], svn_user ), opts: { stdio: 'inherit', cwd: svn_path } }, function( error, result, code ) {
					grunt.log.ok( 'Subversion update done.' );

					// Delete trunk
					grunt.file.delete( svn_trunk );
					grunt.log.ok( 'Subversion trunk deleted.' );

					// Copy deploy to trunk
					grunt.log.writeln( 'Copying deploy to trunk...' );

					grunt.util.spawn( { cmd: 'cp', args: [ '-R', deploy_path, svn_trunk ], opts: { stdio: 'inherit' } }, function( error, result, code ) {
						grunt.log.ok( 'Copied: ' + deploy_path.cyan + ' -> ' + svn_trunk.cyan + ' done.' );

						// Subverion add
						grunt.log.writeln( 'Subversion add...' );

						grunt.util.spawn( { cmd: 'svn', args: [ 'add', '.', '--force', '--auto-props', '--parents', '--depth', 'infinity' ], opts: { stdio: 'inherit', cwd: svn_path } }, function( error, result, code ) {
							grunt.log.ok( 'Subversion add done.' );

							// Subversion remove
							grunt.log.writeln( 'Subversion remove...' );

							child = exec( "svn rm $( svn status | sed -e '/^!/!d' -e 's/^!//' )", { cwd: svn_path }, function() {
								grunt.log.ok( 'Subversion remove done.' );

								// Subversion tag
								grunt.log.writeln( 'Check if Subversion tag dir exists...' );

								if ( grunt.file.isDir( svn_tags ) ) {
									grunt.fail.fatal( 'Subversion tag already exists.' );
								} else {
									grunt.log.writeln( 'Subversion tag...' );

									grunt.util.spawn( { cmd: 'svn', args: [ 'copy', svn_trunk, svn_tags ], opts: { stdio: 'inherit', cwd: svn_path } },  function( error, result, code ) {
										grunt.log.writeln( 'Subversion tag done.' );

										svnCommit();
									});
								}
							});
						});
					});
				});
			};

			var svnCommit = function() {
				var commit_message = 'Release ' + plugin_ver[1] + ', see readme.txt for changelog.';

				grunt.log.writeln( 'Subversion commit...' );

				grunt.log.ok( commit_message );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'ci', '-m', commit_message ], svn_user ), opts: { stdio: 'inherit', cwd: svn_path } },  function( error, result, code ) {
					grunt.log.ok( commit_message );

					done();
				});
			};

			grunt.log.writeln( 'Check if Subversion dir exists...' );

			if ( grunt.file.isDir( svn_path ) ) {
				grunt.log.ok( 'Subversion dir exists.' );

				svnUpdate();
			} else {
				grunt.log.ok( 'Subversion dir doesn\'t exists.' );

				grunt.log.writeln( 'Checking out: ' + svn_repo.cyan );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'co', svn_repo, svn_path ], svn_user ), opts: { stdio: 'inherit' } }, function( error, result, code ) {
					grunt.log.ok( 'Subversion checkout done.' );

					svnUpdate();
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
