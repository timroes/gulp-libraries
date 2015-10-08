'use strict';

var directories = require('./directories'),
	fs = require('fs');

function PackageScanner(config) {
	this.config = config;
}

function sortPackages(pkgs, order) {
	var sorted = [];
	// The packages for which an order is specified will always come first
	order.forEach(function(id) {
		if (id in pkgs) {
			sorted.push(pkgs[id]);
			delete pkgs[id];
		}
	});
	// After the specified packages have been added, add the rest of the packages
	// that haven't been sorted yet
	for (var pkgId in pkgs) {
		sorted.push(pkgs[pkgId]);
	}
	return sorted;
}

/**
 * Returns an array of sorted dependency informations.
 * The sorting will be influenced by the "order" key in the config file.
 *
 * @return {object[]} an array of objects with each object holding the id (id)
 *                    and the module directory (dir) of the dependency
 */
PackageScanner.prototype.getOrderedDependencies = function() {
	// get the bower.json of the project using this library
	var bowerJson = require(directories.calling('bower.json'));

	var pkgs = {};
	for(var pkgId in bowerJson.dependencies) {
		if (!this.config.isExcluded(pkgId)) {
			pkgs[pkgId] = {
				id: pkgId,
				dir: directories.modules(pkgId)
			};
		}
	}


	// If the user has specified a package order, sort using that order, otherwise
	// use the default order (which is unspecified)
	// TODO: this is now broken due to automaticaly sorting. see how to match both of these
	var packageOrder = this.config.getPackageOrder();
	var orderedPackages = packageOrder ? sortPackages(pkgs, packageOrder) : pkgs;

	return orderedPackages;
};

module.exports = PackageScanner;