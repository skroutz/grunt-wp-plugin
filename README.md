# grunt-wp-plugin

> Grunt plug-in to deploy the WordPress plug-in to SVN repository.

### Requirements
* This plugin requires Grunt `~0.4.5`
* [Subversion](https://subversion.apache.org/) installed and in your PATH.

## Getting Started
If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-wp-plugin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks( 'grunt-wp-plugin' );
```

## The "wp_plugin" task

This task is for deploying a plug-in to the [WordPress repository](http://wordpress.org/plugins/) from a `deploy` directory.

_Run this task with the `grunt wp_plugin` command._

### Before you start, you'll need...
 1. To have been [accepted](http://wordpress.org/plugins/about/) on to the WordPress repository
 2. **readme.txt** - See [http://wordpress.org/plugins/about/#readme](http://wordpress.org/plugins/about/#readme)
 3. **plugin-slug** - Get this from your plug-in's repo url: *http://wordpress.org/plugins/{plugin-slug}*
 4. **plugin-slug.php** - The 'main file' of the plug-in(containing the plugin header). Currently this must be named `{plugin-slug}.php` where `{plugin-slug}` should be replaced by your plug-in's slug. See (3).
 5. **deploy directory** - This is a complete copy of the plug-in as you want it on the directory.
 6. **assets directory** - (Optional) This directory should contain the plug-in's icons, banners and screenshots that you want in the 'assets' directory in the root of the plug-ins WordPress SVN repo. See [https://wordpress.org/plugins/about/faq/](https://wordpress.org/plugins/about/faq/) for details.

### Overview

In your project's Gruntfile, add a section named `wp_plugin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  wp_plugin: {
    deploy: {
      options: {
        assets_dir: 'wp-assets-dir',   // Relative path to your assets directory (optional).
        deploy_dir: 'wp-deploy-dir',   // Relative path to your deploy directory (required).
        plugin_slug: 'your-plugin-slug',
        svn_username: 'your-wp-repo-username'
      }
    }
  }
});
```

### Options

#### options.assets_dir
Type: `String`
Default value: `false`

The directory where the plug-in's assets (i.e. icons, banners and screenshots) exist. This gets copied into the *assets* directory in the root of your WordPress SVN repo.
Typically this directory contains your plug-in's icons, banners and screenshots, which you want uploaded to the WordPress repo, but do not necessary want included in the plug-in distributed 
to users. For more details see: [https://wordpress.org/plugins/about/faq/](https://wordpress.org/plugins/about/faq/).

#### options.deploy_dir
Type: `String`
Default value: `false`

The directory where the plug-in exists as you want it on the repo.

#### options.plugin_slug
Type: `String`
Default value: `false`

Your plug-in's slug as indicated by its repository url *http://wordpress.org/plugins/{plugin-slug}*

#### options.svn_username
Type: `String`
Default value: `false`

Your WordPress repository username. If not provided, you'll be prompted for this when the task runs.

#### options.svn_repository
Type: `String`
Default value: `http://plugins.svn.wordpress.org/{plugin-slug}`

For flexibilty this plug-in can work with other repos. Simple provide the SVN url, using `{plugin-slug}` as placeholder indicating where the plug-in slug should be.

## License

Copyright (c) 2015 [AxisThemes](http://axisthemes.com)  
Licensed under the MIT license:  
<http://axisthemes.mit-license.org/>
