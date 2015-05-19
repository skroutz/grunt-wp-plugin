/*
 * grunt-wp-plugin
 * https://github.com/axisthemes/grunt-wp-plugin
 *
 * Copyright (c) 2015 AxisThemes
 * Licensed under the MIT license.
 */

'use strict';

exports.init = function( grunt ) {
	var exports = {};

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
	 * @param  {string} readme Readme Stable tag
	 * @return {integer|boolean}
	 */
	exports.versionCompare = function( plugin, readme ) {
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

	return exports;
};
