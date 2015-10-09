'use strict';

var findup = require('findup-sync'),
	fs = require('fs'),
	path = require('path'),
	q = require('q'),
	resolve = require('resolve'),
	through2 = require('through2');

var config = require('./config'),
	directories = require('./directories'),
	files = require('./fileLists'),
	packageScanner = require('./packageScanner'),
	packageSorter = require('./packageSorter');

var MetadataCache = require('./metadataCache'),
	Registry = require('./registry');

var gulp, configured;

var configured = q.defer();

function parentPackage(name) {
	var pkg;
	try {
		var path = resolve.sync(name, { basedir: directories.calling() });
		return require(path);
	} catch(e) {
		return null;
	}
}

function addAllFilesFromMeta(moduleDir, meta) {
	for (var type in meta) {
		// Ignore special keys in metadata (that will be handled elsewhere)
		if (type === 'modules' || type === 'options') {
			continue;
		}

		files.add(type, meta[type].map(function(file) {
			return path.join(moduleDir, file);
		}));
	}
}

function init(options) {
	config(options);

	gulp = parentPackage('gulp');
	if(!gulp) {
		console.error("gulp-libraries requires gulp to be installed in your package.");
		return;
	}

	var registry = new Registry();
	var metaCache = new MetadataCache(registry);

	var dependenciesPromises = packageScanner.getDependencies()
		.map(function(id) {
			return metaCache.get(id)
				.then(function(metadata) {
					return {
						id: id,
						dir: directories.modules(id),
						metadata: metadata
					};
				});
		});

	// Wait for metadata of all dependencies to be fetched
	q.all(dependenciesPromises).then(function(depInfos) {

		depInfos = packageSorter.sort(depInfos);

		// Look into all dependencies metadata
		depInfos.forEach(function(depInfo) {

			// Add files of each dependeny to the files handler
			addAllFilesFromMeta(depInfo.dir, depInfo.metadata);

			// If the user has modules specified for that dependency try to add the module files
			var options = config.packageOptions(depInfo.id);
			if (options.modules) {
				var depMods = depInfo.metadata.modules || {};
				options.modules.forEach(function(activeModule) {
					if (depMods[activeModule]) {
						addAllFilesFromMeta(directories.modules(depInfo.id), depMods[activeModule]);
					} else {
						console.warn("The requested module '%s' does not exist in package '%s'.", activeModule, depInfo.id);
					}
				});
			}
		})

		configured.resolve();

	})
	.catch(function(reason) {
		configured.reject(reason);
	});

}

function getFiles(type, opts, gulpOpts) {

	opts = opts || {};
	gulpOpts = gulpOpts || {};

	// Check explicitly on false, because default value is true
	if (opts.flatten === false) {
		gulpOpts.base = directories.modules();
	}
	// TODO: if use flatten packages check that no files have the same name

	// Create a new file stream that will be filled once the
	// library finished configuration
	var stream = through2.obj();

	configured.promise.then(function() {
		// Once the library finished configuration, we create a gulp.src stream
		// for the requested type of resources and copy all its resources over to
		// the already returned stream
		gulp.src(files.get(type), gulpOpts)
			.pipe(through2.obj(function(chunk, enc, callback) {
				stream.push(chunk, enc);
				callback();
			}, function() {
				// End the original stream, if the gulp.src stream ends
				stream.end();
			}));
	})
	.catch(function(reason) {
		// TODO: How to properly error a gulp/node stream? currently stream just ends
		console.error("gulp-libraries wasn't able to retrieve the metadata for all libraries:\n%s", reason);
		stream.emit('error', new Error());
	});

	return stream;
}

module.exports = init;
module.exports.files = getFiles;