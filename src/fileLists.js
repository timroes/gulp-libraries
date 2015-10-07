'use strict';

// TODO: documentation

var files = {};

module.exports.getAll = function() {
	return files;
};

module.exports.get = function(type) {
	if (Array.isArray(type)) {
		return type.reduce(function(prev, cur) {
			return prev.concat(files[cur] || []);
		}, []);
	} else {
		return files[type] || [];
	}
};

module.exports.add = function(type, f) {
	if (!files[type]) {
		files[type] = [];
	}
	files[type].push.apply(files[type], f);
};
