/*
 * grunt-wp-plugin
 * https://github.com/axisthemes/grunt-wp-plugin
 *
 * Copyright (c) 2015 AxisThemes
 * Licensed under the MIT license.
 */

'use strict';

var inquirer = require( 'inquirer' );

module.exports = function( grunt ) {
	var copy = require( 'cpy' );
	var path = require( 'path' );
	var util = require( './lib/util' ).init( grunt );
	var exec = require( 'child_process' ).exec, child;

	grunt.registerMultiTask( 'wp_plugin', 'Deploy the WordPress plug-in to SVN repository.', function() {
		var done = this.async();

		var options = this.options({
			assets_dir: false,
			deploy_dir: false,
			plugin_slug: false,
			svn_username: false,
			svn_repository: 'http://plugins.svn.wordpress.org/{plugin-slug}'
		});

		var assetsDir  = path.resolve( options.assets_dir );
		var deployDir  = path.resolve( options.deploy_dir );
		var readmeFile = path.join( deployDir, 'readme.txt' );
		var pluginFile = path.join( deployDir, options.plugin_slug + '.php' );

		// Get plug-in versions
		var readmeVersion = grunt.file.read( readmeFile ).match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );
		var pluginVersion = grunt.file.read( pluginFile ).match( new RegExp( '[^\t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );

		// Check before processing
		if ( ! options.plugin_slug ) {
			grunt.fail.fatal( 'Plug-in must have a slug, stupid.' );
		} else if ( ! grunt.file.isDir( deployDir ) ) {
			grunt.fail.fatal( 'Plug-in deploy directory not found.' );
		} else if ( ! grunt.file.exists( readmeFile ) ) {
			grunt.fail.fatal( 'Plug-in file "readme.txt" is missing.' );
		} else if ( ! grunt.file.exists( pluginFile ) ) {
			grunt.fail.fatal( 'Plug-in file "' + options.plugin_slug + '.php" is missing.' );
		} else if ( util.versionCompare( pluginVersion[1], readmeVersion[1] ) ) {
			grunt.verbose.ok( 'Plugin version: ' + pluginVersion[1].cyan );
			grunt.verbose.ok( 'Readme version: ' + readmeVersion[1].cyan );
			grunt.fail.fatal( 'Plugin and Readme versions do not match.' );
		} else {
			grunt.verbose.ok( 'Plug-in is valid for processing...' );
		}

		inquirer.prompt([{
			type: 'input',
			name: 'svn_username',
			message: 'Please enter your svn username',
			when: function() {
				if ( ! options.svn_username ) {
					return true;
				}
			},
			validate: function( answers ) {
				if ( answers.length < 1 ) {
					return 'Username cannot be empty, fool.';
				}
				return true;
			}
		}], function( answers ) {
			var svnTmpDir    = path.resolve( path.join( 'tmp', options.plugin_slug ) );
			var svnTagsDir   = path.join( svnTmpDir, 'tags', pluginVersion[1] );
			var svnTrunkDir  = path.join( svnTmpDir, 'trunk' );
			var svnAssetsDir = path.join( svnTmpDir, 'assets' );

			/**
			 * Subversion Arguments.
			 * @param  {array} args
			 * @return {array} args
			 */
			var svnArgs = function( args ) {
				var svnUser = options.svn_username || answers.svn_username;
				if ( svnUser ) {
					args.push( '--username', svnUser );
				}

				return args;
			};

			/**
			 * Subversion Update.
			 * @return {null}
			 */
			var svnUpdate = function() {
				grunt.log.ok( 'Subversion update...' );
				grunt.util.spawn( { cmd: 'svn', args: svnArgs( ['up'] ), opts: { stdio: 'inherit', cwd: svnTmpDir } }, function( error, result, code ) {
					if ( error ) {
						grunt.fail.fatal( 'Subversion update unsuccessful.' );
					}

					// Copy plug-in assets
					if ( grunt.file.isDir( assetsDir ) ) {
						grunt.log.writeln( 'Copying Plug-in assets...' );

						// Delete assets
						if ( grunt.file.isDir( svnAssetsDir ) ) {
							grunt.file.delete( svnAssetsDir, { force: true } );
							grunt.log.warn( 'Delete: ' + svnAssetsDir.cyan );
						}

						copy([
							assetsDir + '/icon.svg',
							assetsDir + '/icon-*.{png,jpg}',
							assetsDir + '/banner-*.{png,jpg}',
							assetsDir + '/screenshot-*.{png,jpg}'
						], svnAssetsDir, function( err ) {
							grunt.log.ok( 'Copied: ' + assetsDir.cyan + ' -> ' + svnAssetsDir.cyan );
						});
					}

					// Delete trunk
					if ( grunt.file.isDir( svnTrunkDir ) ) {
						grunt.file.delete( svnTrunkDir, { force: true } );
						grunt.log.ok( 'Deleted: ' + svnTrunkDir.cyan );
					}

					// Copy deploy to trunk
					grunt.log.ok( 'Copying deploy to trunk...' );
					grunt.util.spawn( { cmd: 'cp', args: [ '-R', deployDir, svnTrunkDir ], opts: { stdio: 'inherit' } }, function( error, result, code ) {
						grunt.log.ok( 'Copied: ' + deployDir.cyan + ' -> ' + svnTrunkDir.cyan );

						// Subversion add
						grunt.log.writeln( 'Subversion add...' );
						grunt.util.spawn( { cmd: 'svn', args: [ 'add', '.', '--force', '--auto-props', '--parents', '--depth', 'infinity' ], opts: { stdio: 'inherit', cwd: svnTmpDir } }, function( error, result, code ) {
							grunt.log.ok( 'Subversion add done.' );

							// Subversion remove
							grunt.log.writeln( 'Subversion remove...' );
							child = exec( "svn rm $( svn status | sed -e '/^!/!d' -e 's/^!//' )", { cwd: svnTmpDir }, function() {
								grunt.log.ok( 'Subversion remove done.' );

								// Subversion tag
								if ( grunt.file.isDir( svnTagsDir ) ) {
									grunt.log.warn( 'Tag ' + pluginVersion[1] +' already exists.' );
									svnCommit();
								} else {
									grunt.log.writeln( 'Copying to tag...' );
									grunt.util.spawn( { cmd: 'svn', args: [ 'copy', svnTrunkDir, svnTagsDir ], opts: { stdio: 'inherit', cwd: svnTmpDir } },  function( error, result, code ) {
										grunt.log.ok( 'Copied to tag.' );
										svnCommit();
									});
								}
							});
						});
					});
				});
			};

			/**
			 * Subversion Commit.
			 * @return {null}
			 */
			var svnCommit = function() {
				var commitMessage = 'Release ' + pluginVersion[1] + ', see readme.txt for changelog.';

				// Ask for confirm?
				inquirer.prompt([{
					type: 'confirm',
					name: 'release',
					message: 'Are you sure you want plug-in version released?',
					default: false
				}], function( answers ) {
					if ( ! answers.release ) {
						grunt.log.warn( 'Aborting, Plug-in version release...' );
						return;
					}

					grunt.log.writeln( 'Subversion commit...' );
					grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'ci', '-m', commitMessage ] ), opts: { stdio: 'inherit', cwd: svnTmpDir } },  function( error, result, code ) {
						grunt.log.ok( commitMessage );
						done();
					});
				});
			};

			// Plug-in Release Workflow :)
			if ( grunt.file.isDir( svnTmpDir ) ) {
				svnUpdate();
			} else {
				var svnRepo = options.svn_repository.replace( '{plugin-slug}', options.plugin_slug );

				// Plug-in checkout
				grunt.log.ok( 'Subversion checkout: ' + svnRepo.cyan );
				grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'co', svnRepo, svnTmpDir ] ), opts: { stdio: 'inherit' } }, function( error, result, code ) {
					if ( error ) {
						grunt.fail.fatal( 'Subversion checkout unsuccessful.' );
					}

					svnUpdate();
				});
			}
		});
	});
};
