'use strict';

var directories = require('./directories'),
	fs = require('q-io/fs'),
	helpers = require('./helpers'),
	q = require('q');

function MetadataCache(registry) {
	this.cache = {};
	this.registry = registry;
}

/**
 * Retrieves the metadata of the specified package in the specified version.
 * It will first look if the locally installed package brings its own metadata.json.
 * If not it will query the central repository.
 *
 * @param {string} id - the package id
 */
MetadataCache.prototype.get = function(id) {

	// Look up cached result first
	if (id in this.cache) {
		return q.when(this.cache[id]);
	}

	var localMetadata = directories.modules(id, 'metadata.json');
	var pkgBower = helpers.bowerConfig(id);

	var metadata;
	var self = this;

	return fs.exists(localMetadata)
		.then(function(exists) {
			if (exists) {
				try {
					return require(localMetadata);
				} catch(e) {
					return q.reject(e);
				}
			} else {
				return self.registry.loadMetadata(id, pkgBower.version);
			}
		})
		.then(function(metadata) {
			self.cache[id] = metadata;
			return metadata;
		});

};

/**
 * Clears the cache, so the metadata information for all packages
 * need to be retrieved the next time it is queried.
 */
MetadataCache.prototype.clearCache = function() {
	cache = {};
};

module.exports = MetadataCache;