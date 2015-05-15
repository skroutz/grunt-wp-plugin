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

	grunt.registerMultiTask( 'wpsvn', 'Deploy a project directory to WordPress SVN repo.', function() {
		var done = this.async();

		var options = this.options({
			assets_dir: false,
			deploy_dir: false,
			plugin_slug: false,
			svn_username: false,
			svn_repository: 'http://plugins.svn.wordpress.org/{plugin-slug}'
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
			var svnpath     = '/tmp/' + slug;
			var deploy_path = options.deploy_dir.replace( /\/?$/, '/' ); // trailingslash
			var plugin_file = deploy_path + slug + '.php';
			var readme_file = deploy_path + 'readme.txt';

			// SVN User and Repository URl
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
			var readmeVersion = readme.match( new RegExp( '^Stable tag:\\s*(\\S+)', 'im' ) );
			var pluginVersion = plugin.match( new RegExp( '^[ \t\/*#@]*Version:\\s*(\\S+)$', 'im' ) );
		});
	});
};
