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
			assets_dir: false,
			deploy_dir: false,
			plugin_slug: false,
			svn_username: false,
			svn_repository: 'http://plugins.svn.wordpress.org/{plugin-slug}'
		});

		var questions = [];

		if ( ! options.deploy_dir ) {
			grunt.fail.fatal( 'Plug-in deploy directory not found.' );
		} else if ( ! options.plugin_slug ) {
			grunt.fail.fatal( 'Every plug-in must have a slug, fool.' );
		} else if ( ! options.svn_username ) {
			questions.push({
				type: 'input',
				name: 'svn_username',
				message: 'What\'s your SVN Username?',
				validate: function( answer ) {
					if ( answer.length < 1 ) {
						return 'Username can\'t be empty, stupid.';
					}
					return true;
				},
				filter: function( val ) {
					return val.toLowerCase();
				}
			});
		}

		inquirer.prompt( questions, function( answers ) {
			var deployDir = path.resolve( options.deploy_dir );
			var svnTmpDir = path.resolve( path.join( 'tmp', options.plugin_slug ) );

			/**
			 * Subversion Arguments.
			 * @param  {array} args
			 * @return {array} args
			 */
			var svnArgs = function( args ) {
				var svn_username = options.svn_username || answers.svn_username;
				if ( svn_username ) {
					args.push( '--username' );
					args.push( svn_username );
				}

				return args;
			};

			/**
			 * Subversion Update.
			 * @return {null}
			 */
			var svnUpdate = function() {
				var svnTagsDir  = svnTmpDir + '/tags/' + getVersion();
				var svnTrunkDir = svnTmpDir + '/trunk';

				// Subversion update
				grunt.log.writeln( 'Subversion update...' );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( ['up'] ), opts: { stdio: 'inherit', cwd: svnTmpDir } }, function( error, result, code ) {
					grunt.log.ok( 'Subversion update done.' );

					// Delete trunk
					grunt.file.delete( svnTrunkDir );
					grunt.log.ok( 'Subversion trunk deleted.' );

					// Copy deploy to trunk
					grunt.log.writeln( 'Copying deploy to trunk...' );

				});
			};

			/**
			 * Subversion Checkout.
			 * @return {null}
			 */
			var svnCheckout = function() {
				var svn_repository = options.svn_repository.replace( '{plugin-slug}', options.plugin_slug );

				grunt.log.writeln( 'Subversion checkout: ' + svn_repository.cyan );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'co', svn_repository, svnTmpDir ] ), opts: { stdio: 'inherit' } }, function( error, result, code ) {
					grunt.log.ok( 'Subversion checkout done.' );

					svnUpdate();
				});
			};

			/**
			 * Subversion Commit.
			 * @return {null}
			 */
			var svnCommit = function() {
				var commit_message = 'Release ' + getVersion() + ', see readme.txt for changelog.';

				grunt.log.writeln( 'Subversion commit...' );

				grunt.log.ok( commit_message );

				grunt.util.spawn( { cmd: 'svn', args: svnArgs( [ 'ci', '-m', commit_message ] ), opts: { stdio: 'inherit', cwd: svnTmpDir } },  function( error, result, code ) {
					grunt.log.ok( commit_message );

					done();
				});
			};

			/**
			 * Get Plug-in Release Version.
			 * @return {string} version
			 */
			var getVersion = function() {
				var plugin_path = deployDir.replace( /\/?$/, '/' ); // trailingslash
				var plugin_file = plugin_path + options.plugin_slug + '.php';
				var readme_file = plugin_path + 'readme.txt';

				// Check if Plug-in and Readme file exists
				if ( ! grunt.file.exists( plugin_file ) ) {
					grunt.fail.warn( 'Plug-in file "' + plugin_file + '" not found.' );
				} else if ( ! grunt.file.exists( readme_file ) ) {
					grunt.fail.warn( 'Readme file "' + readme_file + '" not found.' );
				}

				// Get Versions:
				var plugin_version = grunt.file.read( plugin_file ).match( new RegExp( '^[ \t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );
				var readme_version = grunt.file.read( readme_file ).match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );

				// Version Compare
				if ( version_compare( plugin_version[1], readme_version[1] ) ) {
					grunt.log.warn( 'Plugin version: ' + ( 'v' + plugin_version[1] ).cyan );
					grunt.log.warn( 'Readme version: ' + ( 'v' + readme_version[1] ).cyan );
					grunt.fail.warn( 'Main Plug-in and Readme file version do not match.' );
				}

				return plugin_version[1];
			};

			/**
			 * Simply compares Plug-in and Readme file version.
			 *
			 * Returns:
			 * -1 = plugin is LOWER than readme
			 *  0 = they are equal
			 *  1 = plugin is GREATER = readme is LOWER
			 *  And FALSE if one of input versions are not valid
			 *
			 * @param  {string} plugin Plug-in Version
			 * @param  {string} readme Readme Stable Tag
			 * @return {integer|boolean}
			 */
			var versionCompare = function( plugin, readme ) {
				if ( typeof plugin + typeof readme !== 'stringstring' ) {
					return false;
				}

				var a = plugin.split( '.' );
				var b = readme.split( '.' );

				for ( var i = 0; i < Math.max( a.length, b.length ); i++ ) {
					if ( ( a[i] && ! b[i] && parseInt( a[i], 10 ) > 0 ) || ( parseInt( a[i], 10 ) > parseInt( b[i], 10 ) ) ) {
						return 1;
					} else if ( ( b[i] && ! a[i] && parseInt( b[i], 10 ) > 0 ) || ( parseInt( a[i], 10 ) < parseInt( b[i], 10 ) ) ) {
						return -1;
					}
				}

				return 0;
			};

			/**
			 * Subversion Update or Checkout Logic.
			 * @return {null}
			 */
			grunt.log.writeln( 'Check if Subversion dir exists...' );

			if ( grunt.file.isDir( svnTmpDir ) ) {
				grunt.log.ok( 'Subversion dir exists.' );

				svnUpdate();
			} else {
				grunt.log.ok( 'Subversion dir doesn\'t exists.' );

				svnCheckout();
			}
		});
	});
};
