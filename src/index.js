'use strict';

var findup = require('findup-sync'),
	fs = require('fs'),
	path = require('path'),
	q = require('q'),
	resolve = require('resolve'),
	through2 = require('through2');

var directories = require('./directories'),
	files = require('./fileLists');

var Config = require('./config'),
	MetadataCache = require('./metadataCache'),
	PackageScanner = require('./packageScanner'),
	Registry = require('./registry');

var gulp, config, configured;

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
	var options = options || {};
	var configFile = options.config || 'libraries.json';

	// TODO: Besides the configFile options it would be nice to have every
	//       every option available either in the config file or passed to this method

	var registryUrl = options.metadataRegistry || 'https://github.com/timroes/gulp-libraries-registry/';

	var registry = new Registry(registryUrl);
	var metaCache = new MetadataCache(registry);

	gulp = parentPackage('gulp');
	if(!gulp) {
		console.error("gulp-libraries requires gulp to be installed in your package.");
		return;
	}

	config = new Config(directories.calling(configFile));
	var packageScanner = new PackageScanner(config);

	var dependencies = packageScanner.getOrderedDependencies();

	var dependenciesPromises = dependencies.map(function(dep) {
		return metaCache.get(dep.id)
			.then(function(metadata) {
				return {
					id: dep.id,
					dir: dep.dir,
					metadata: metadata
				};
			});
	});

	// Wait for metadata of all dependencies to be fetched
	q.all(dependenciesPromises).then(function(depInfos) {

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
		console.error("gulp-libraries wasn't able to retrieve the metadata for all libraries:\n%s", reason);
		// TODO: How to properly error a gulp/node stream? currently stream just ends
		stream.end(); // TODO: replace!
	});

	return stream;
}

module.exports = init;
module.exports.files = getFiles;