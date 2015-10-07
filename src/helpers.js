'use strict';

var bower = require('bower'),
	directories = require('./directories');

var bowerJson = 'bower.json';

/**
 * Returns the content of the bower.json file of the specified dependency.
 * Only works as long as this dependency has been downloaded (i.e. exists
 * in the loca modules directory).
 * If you don't pass a package id the bower.json of the package using this
 * library will be returned instead.
 *
 * @param {string} id - the package id
 * @return {object} the content of the package's bower.json
 */
module.exports.bowerConfig = function(id) {
	return require(id ? directories.modules(id, bowerJson) : directories.calling(bowerJson));
};
