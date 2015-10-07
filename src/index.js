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
		if (type === 'modules') {
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

	// We got some information, now do something with it
	console.log(dependencies);

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

		console.log("Has all dependency information");
		configured.resolve();

	})
	.catch(function() {
		console.log("Some dependency failed");
		throw arguments[0];
	});

}

function getFiles(type, opts, gulpOpts) {

	opts = opts || {};
	gulpOpts = gulpOpts || {};

	// Check explicitly on false, because default value is true
	if (opts.flatten === false) {
		gulpOpts.base = directories.modules();
	}
	// TODO: if use flatte packages check that no files have the same name

	// Create a new file stream for the files of the specified type
	var stream = through2.obj();

	configured.promise.then(function() {
		gulp.src(files.get(type), gulpOpts)
			.pipe(through2.obj(function(chunk, enc, callback) {
				console.log(chunk);
				stream.push(chunk, enc);
				callback();
			}))
			.on('end', function() {
				stream.done();
			});
	});

	return stream;
	// stream.push('--remove--');
	// stream.pipe(through2.obj(function(chunk, enc, callback) {

	// 		console.log(chunk, enc);
	// 		console.log("Inside empty stream?");
	// 		this.push(chunk);
	// 		callback();
	// 	}));

	// 	console.log(stream.push);
	// return gulp.src("**/*.json", gulpOpts)
	// 	.pipe(through2.obj(function(chunk, enc, c1) {

	// 		// TODO: We can wait here! for whatsoever
	// 		// TODO: Some magic: replace this stream by gulp.src(files.get(type), gulpOpts)
	// 		// console.log("we have some files?");
	// 		var self = this;


	// 		configured.promise.then(function() {

	// 			// self.push(chunk);
	// 			c1();

	// 			// gulp.src(files.get(type), gulpOpts).pipe(through2.obj(function (chunk, enc, c2) {
	// 			// 	self.push(chunk);
	// 			// 	c1();
	// 			// 	c2();
	// 			// }));
	// 		});
	// 	}));
}

module.exports = init;
module.exports.files = getFiles;