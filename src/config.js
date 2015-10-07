'use strict';

var fs = require('fs'),
	util = require('util');

function Config(configFile) {
	try {
		this.config = require(configFile);
	} catch(e) {
		// If the config file does not exist, that is fine too
		this.config = {};
	}

	this.config.options = this.config.options || {};
}

/**
 * Returns whether the package with the specific id is excluded.
 * These packages shouldn't be handled by the library.
 *
 * @param {string} id - the package id as used in bower
 */
Config.prototype.isExcluded = function(id) {
	return Array.isArray(this.config.exclude) && this.config.exclude.indexOf(id) > -1;
};

/**
 * Returns the configured package order.
 * This is an array of package names. The plugin will place the defined
 * libraries in the specified order to the beginning of the file list.
 * All other dependencies will be put to the end of the file stream.
 * Dependencies in the config, that do not exist will be ignored.
 *
 * @return {string[]} an array of package names
 */
Config.prototype.getPackageOrder = function() {
	return this.config.order || [];
};

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
Config.prototype.packageOptions = function(id) {
	if (id) {
		return this.config.options[id] || {};
	} else {
		return this.config.options;
	}
};


module.exports = Config;