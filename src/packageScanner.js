'use strict';

var config = require('./config'),
	directories = require('./directories');

/**
 * Returns an array of sorted dependency informations.
 *
 * @return {string[]} an array of the ids of all dependencies this library
 *                    needs to handle
 */
module.exports.getDependencies = function() {
	// get the bower.json of the project using this library
	var bowerJson = require(directories.calling('bower.json'));

	var excludedPackages = config.get('exclude', []);

	return Object.keys(bowerJson.dependencies).filter(function(id) {
		return excludedPackages.indexOf(id) < 0;
	});

	return pkgs;
};
