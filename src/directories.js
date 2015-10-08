'use strict';

var bower = require('bower'),
	path = require('path');

function callingModule() {
	// TODO(#7): Need a proper way of finding the "real" calling module
	var mod = module.parent;
	while (mod && !mod.id.match(/gulpfile\.js$/)) {
		mod = mod.parent;
	}
	if(!mod) {
		console.error("Could not find the calling module.");
	}
	return mod;
}

// The root directory of the module that actually uses this library
var callingDirectory = path.dirname(callingModule().filename);

/**
 * Returns the base folder, where all the dependencies are stored in.
 * For now this will always be the bower directory, since bower is the only
 * dependency system currently supported.
 * You can pass an arbitrary number of arguments, wich will be appended to
 * the modules path (i.e. to get sub directories of this path).
 *
 * @return {string} - the path
 */
module.exports.modules = function() {
	var args = Array.prototype.slice.call(arguments);
	return path.join.apply(path, [callingDirectory, bower.config.directory].concat(args));
};

/**
 * Returns the root folder of the project that uses this library.
 * You can pass an arbitrary number of arguments, which will be appended to
 * that path (i.e. to get sub directories of this path).
 *
 * @return {string} - the path
 */
module.exports.calling = function() {
	var args = Array.prototype.slice.call(arguments);
	return path.join.apply(path, [callingDirectory].concat(args));
};