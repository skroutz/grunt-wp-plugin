/*
 * grunt-wp-plugin
 * https://github.com/axisthemes/grunt-wp-plugin
 *
 * Copyright (c) 2014 AxisThemes
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function( grunt ) {

	// Project Configuration.
	grunt.initConfig({

		// Validate files with JSHint.
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		wp_plugin: {
			options: {
				svn_username: 'shivapoudel',
				svn_repository: 'https://svn.riouxsvn.com/{plugin-slug}'
			},
			plugin: {
				options: {
					assets_dir: 'test/assets/',
					deploy_dir: 'test/deploy/',
					plugin_slug: 'wp-plugin-test'
				}
			}
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks( 'tasks' );

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-nodeunit' );

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask( 'test', ['clean', 'wp_plugin', 'nodeunit'] );

	// Register default task.
	grunt.registerTask( 'default', ['jshint', 'test'] );
};
