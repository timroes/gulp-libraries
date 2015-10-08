'use strict';

var directories = require('./directories');

/**
 * Returns an array of sorted dependency informations.
 * The sorting will be influenced by the "order" key in the config file.
 *
 * @return {object[]} an array of objects with each object holding the id (id)
 *                    and the module directory (dir) of the dependency
 */
module.exports.getDependencies = function(config) {
	// get the bower.json of the project using this library
	var bowerJson = require(directories.calling('bower.json'));

	// var pkgs = [];
	return Object.keys(bowerJson.dependencies).filter(function(id) {
		return !config.isExcluded(id);
	});
	// for(var pkgId in bowerJson.dependencies) {
	// 	if (!this.config.isExcluded(pkgId)) {
	// 		pkgs.push({
	// 			id: pkgId,
	// 			dir: directories.modules(pkgId)
	// 		});
	// 	}
	// }

	return pkgs;
};
