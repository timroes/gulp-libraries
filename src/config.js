'use strict';

var directories = require('./directories'),
	fs = require('fs'),
	util = require('util');

var config, userOptions;

/**
 * Initialize the configuration. You can either pass a filename or the default
 * filename "libraries.json" will be used. Must be called before you can use
 * the configuration.
 *
 * @param {string} options - the filename relative to the caller module's root directory
 */
module.exports = function(options) {
	userOptions = options || {};
	var configFile = userOptions.configPath || 'libraries.json';
	try {
		config = require(directories.calling(configFile));
	} catch(e) {
		config = {};
	}

	config.options = config.options || {};
};

/**
 * Returns the requested key from the configuration or the spcified
 * default value if the key does not exist in the configuration.
 *
 * @param {string} key - a key to lookup
 * @param {any} defaultValue - the default value to fallback to
 * @return the configuration value or the fallback value
 */
function get(key, defaultValue) {
	return userOptions.hasOwnProperty(key) ? userOptions[key]
			: (config.hasOwnProperty(key) ? config[key] : defaultValue);
};
module.exports.get = get;

/**
 * Returns the options set for a specific package in the configuration.
 * Package specific configuration can be used e.g. to enable optional modules
 * on a package.
 *
 * If no package is is specified it will return an object with all options.
 * The key of the object will be the package id and the value the options
 * object as if you would have passed the id directly to this method.
 *
 * @param {?string} id - the package id or nothing to get all package options
 * @return {!object} the options for these packages or an empty object
 */
module.exports.packageOptions = function(id) {
	if (id) {
		return get('options', {})[id] || {};
	} else {
		return get('options', {});
	}
};
