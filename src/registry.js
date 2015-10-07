'use strict';

var METADATADB_DIR = "./metadatadb";

// TODO: rewrite to use a git repository

var fs = require('q-io/fs'),
	git = require('nodegit'),
	path = require('path'),
	q = require('q'),
	semver = require('semver'),
	url = require('url'),
	util = require('util');

/**
 * Creates a new registry to look up metadata in.
 * A registry will be used, when a package does not contain its own metadata.
 *
 * @constructor
 * @param {string} url - the base url of the registry
 */
function Registry(url) {
	this.url = url;
	this.update();
	this.finishedDefer = q.defer();
}

Registry.prototype.waitForFinish = function() {
	return this.finishedDefer.promise;
};

Registry.prototype.update = function() {
	var self = this;
	fs.exists(METADATADB_DIR)
	.then(function(exists) {
		console.log("Does metadatadb exist? ", exists);
		if (!exists) {
			console.log("Checkout out metadata db");
			return git.Clone.clone(self.url, METADATADB_DIR);
		}
	})
	.then(function() {
		console.log("checked out something?");
		return git.Repository.open(METADATADB_DIR);
	})
	.then(function(repo) {
		// TODO: repo.pull
	})
	.catch(function(reason) {
		console.error(util.format("Could not update metadata repository, due to error:\n%s", reason));
	});
};

Registry.prototype.loadMetadata = function(packageId, version) {

	var versionsToCheck = wildcardVersions(version);
	var metadata;

	for (var k in versionsToCheck) {
		var metadataFile = path.join('..', METADATADB_DIR, packageId, versionsToCheck[k], 'metadata.json');
		try {
			metadata = require(metadataFile);
			break;
		} catch(e) {
			// Ignore missing metadata for version, we will try the next (more generic) version (e.g. 1.1.x or 1.x.x)
		}
	}

	if(!metadata) {
		// TODO: If really not found, perhaps wait for git pull to be finished and try again
		return q.reject(util.format("Could not find metadata for '%s' in version '%s'.", packageId, version));
		//TODO: print out explanation on how to request/add such metadata
	}

	return q.when(metadata);
};

/**
 * A utility function, that creates an array of version strings to look for in the
 * registry. As an example if you pass '1.2.3' into this method it will return the
 * array ['1.2.3', '1.2.x', '1.x.x', 'x.x.x']. This is the order in which the registry
 * looks for metadata files (from specific to less specific).
 *
 * @param {string} version - the version in an semantic version format (i.e. major.minor.patch)
 * @return {string[]} the ordered version to look for
 */
function wildcardVersions(version) {
	if (!semver.valid(version)) {
		throw new Error(util.format("'%s' is not a valid semantic version.", version));
	}

	var major = semver.major(version),
		minor = semver.minor(version),
		patch = semver.patch(version);

	return [
		version,
		[major, minor, 'x'].join('.'),
		[major, 'x', 'x'].join('.'),
		'x.x.x'
	];
}

module.exports = Registry;