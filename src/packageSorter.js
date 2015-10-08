'use strict';

var helpers = require('./helpers'),
	util = require('util');

/**
 * @param {string[]} packages - a list of all package names handled by this library
 */
var normalizeInfos = function(packageInfos, packages, config) {

	var isHandled = function(pkg) {
		return packages.indexOf(pkg) > -1;
	};

	var infos = packageInfos.map(function(info) {

		info.metadata.options = info.metadata.options || {};
		
		// If there are dependencies in the bower.json treat them as after-packages,
		// because if the package depend on them, it usually have to be loaded after them.
		var bowerConf = helpers.bowerConfig(info.id);
		var after = [];

		var packageConfig = config.packageOptions(info.id);
		
		if (packageConfig.after) {
			// If the user has specified an "after" array in the config we use this instead of
			// the information from bower dependencies and the metadata information.
			info.metadata.options.after = packageConfig.after;
		} else {
			// If the user doesn't overwrite the "after" in their config, we use
			// the dependencies in the packages bower.json and information in the
			// metadata.json both together
			if (bowerConf.dependencies) {
				after = after.concat(Object.keys(bowerConf.dependencies).filter(isHandled));
			}

			// If the package has after-options filter out all packages, that are not used in this project
			if (info.metadata.options.after) {
				after = after.concat(info.metadata.options.after.filter(isHandled));
			}

			info.metadata.options.after = after;
		}

		return info;
	});

	// TODO: Enable the before attribute, by rewriting it to after on the appropriate package

	var infoMap = {};

	infos.forEach(function(info) {
		infoMap[info.id] = info;
	});

	return infoMap;
};

var findNextPackages = function(packageList, packageInfos) {
	var next = packageList.filter(function(id) {
		return packageInfos[id].metadata.options.after.filter(function(afterId) {
			return packageList.indexOf(afterId) > -1;
		}).length === 0;
	});

	next.forEach(function(id) {
		packageList.splice(packageList.indexOf(id), 1);
	});

	return next;
};

module.exports.sort = function(packageInfos, ignoreCyclicDependencies, config) {

	var unsorted = packageInfos.map(function(info) {
		return info.id;
	});

	packageInfos = normalizeInfos(packageInfos, unsorted, config);

	var sorted = [];

	do {
		var nextSort = findNextPackages(unsorted, packageInfos);
		if (!nextSort.length) {
			if (ignoreCyclicDependencies) {
				// If user switched ignoring cyclic dependencies on just log a warning
				// and add the unsorted dependencies as-is to the sorted list.
				console.warn("Cyclic dependencies between %s", unsorted);
				sorted = sorted.concat(unsorted);
				break;
			}
			throw new Error(util.format('Cyclic dependencies in dependencies:', unsorted));
		}

		sorted.push.apply(sorted, nextSort);
	} while(unsorted.length);

	return sorted.map(function(id) {
		return packageInfos[id];
	});

};