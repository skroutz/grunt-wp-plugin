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
				'tasks/*.js'
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
				svn_repository: 'https://svn.riouxsvn.com/{plugin-slug}'
			},
			deploy: {
				options: {
					assets_dir: 'test/assets/',
					deploy_dir: 'test/deploy/',
					plugin_slug: 'wp-plugin-test'
				}
			}
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks( 'tasks' );

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask( 'test', ['clean', 'wp_plugin'] );

	// Register default task.
	grunt.registerTask( 'default', ['jshint', 'test'] );
};
