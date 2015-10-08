gulp-libraries
=================

**An easy way to deal with libraries.**

What does it do?
----------------

After installing libraries via bower you can use this gulp plugin
to get streams to all your libraries sources you need to copy to your
project. You don't need to specify for each project again, where exactly
the JavaScript or CSS is located, that you need to copy over.

A lengthy explanation of the motivation behind this library can be found
in a [blog post](#) (*TODO: write blog post*) I wrote.

This plugin examines all your dependencies, if they have specified metadata
in their package (see [Metadata for your library](#metadata-library)). If they
don't have metadata, it will look up the metadata for this library in a central
repository (so this pugin also works for libraries, that don't want to specify
metadata on their own). After that you can get access to all JavaScript, CSS or
whatever resources the libraries exported via this plugin.


How to set it up?
-----------------

To use this plugin, you need to `require` it in your Gulpfile and initialize it:

```javascript
var libraries = require('gulp-libraries')();
```

You can pass several options to the initialization of the plugin, to configure it.
The plugin has sensible default values for all the options. The options are described
further down.

After you have initialized the plugin, you can get access to the files of your libraries
by calling the modules `files` method. To just copy all the JavaScript files from all your
libraries to `build/libs` you can write the following task:

```javascript
gulp.task('libsjs', function() {
  libraries.files('js')
    .pipe(gulp.dest('build/libs'));
});
```

A library can export any kind of resources. The most common ones are `js` (JavaScript files),
`css` (CSS files). (*TODO: Define a list somewhere*).

TODO: Ordering of packages

Metadata for your library
-------------------------

*TODO: How the metadata file has to look*

library.json
------------

TODO

API Documentation
-----------------

### `gulp-libraries(options)`

You need to call this in your buildscript to initialize the library.

##### **options** (`object` or `undefined`)

An optional object to configure the library. The following options are available:

* `config` (default: `libraries.json`) - The relative (from the root of your project) path to
  the configuration file for this library. See [library.json](#libraryjson).
* `metadataRegistry` (default: `https://github.com/timroes/gulp-libraries-registry/`) - The base url
  of the metadata registry. This can be any http(s) or file URL. If the plugin tries to look for
  metadata it will try to append the package id and the version and *metadata.json* to the
  base URL and look for that file (e.g. `file:/tmp/jquery/2.0.0/metadata.json`) if you set this
  option to `file:/tmp/`. If you set this option, because you are missing metadata in the official
  repository: sending a pull request is highly appreciated (see
  [Metadata Repository Project](https://github.com/timroes/gulp-libraries-registry)).
* `ignoreCyclicDependencies` TODO

### `gulp-libraries.files(types, opts, gulpOpts)`

Return a file stream (that you can call `.pipe` on) for the specified file types.

##### **types** (`string` or `string[]`)

Either a string or an array of strings. Define the type of files which to create a stream
for (e.g. `js` or `css`). *(TODO: Link to list)* If you specify an array of types, the order
in which the resources appear in the array will determine the order of the files in the stream.

##### **opts** (`object` or `undefined`)

An optional parameter, that can hold options on how to create the stream. There following keys
can be set in the object:

* `keepHierarchy` (default: `false`) - By default this plugin will flatten all packages, so they will all be put in the
  same folder if you output them via `gulp.dest`. If you set `keepHierarchy` to `true` the original
  structure inside the module folder will be kept. E.g. if you include *jquery* that way and output
  with `gulp.dest('tmp')` you will end up having the folder structure `tmp/jquery/dist/jquery.min.js`
  instead of just `tmp/jquery.min.js`.

##### **gulpOpts** (`object` or `undefined`)

An optional parameter that will be passed to the `gulp.src` function as a second parameter.
You can set there any options [`gulp.src` understands](https://github.com/gulpjs/gulp/blob/master/docs/API.md#options).

