'use strict';

var directories = require('./directories');

/**
 * Returns an array of sorted dependency informations.
 * The sorting will be influenced by the "order" key in the config file.
 *
 * @param {Config} config - the config object
 * @return {string[]} an array of the ids of all dependencies this library
 *                    needs to handle
 */
module.exports.getDependencies = function(config) {
	// get the bower.json of the project using this library
	var bowerJson = require(directories.calling('bower.json'));

	return Object.keys(bowerJson.dependencies).filter(function(id) {
		return !config.isExcluded(id);
	});

	return pkgs;
};
