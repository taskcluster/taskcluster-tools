var path      = require('path');
var reactify  = require('reactify');

// Common modules to compiled into a single bundle
var COMMON_MODULES = [
  'react',
  'react-bootstrap',
  'jquery',
  'promise',
  'taskcluster-client',
  'slugid',
  'debug',
  'lodash',
  'marked',
  'moment',
  'spin.js'
];

// Setup grunt
module.exports = function(grunt) {
  // Configuration for the grunt tasks
  var config = {
    // Copy all files over, so that images and assets is available, but also
    // so that sourceMaps from less and browserify bundles will work.
    copy: {
      assets: {
        files: [
          {
            expand:     true,
            src:        [
              '**',                                 // Copy everything
              // We might want to allow node_modules/ so that sourceMaps will
              // work
              //'!node_modules/**', '!node_modules',  // Exclude node_modules/
              '!build/**', '!build',                // Exclude build/
              '!package.json',                      // Exclude package.json
              '!Gruntfile.js',                      // Exclude Gruntfile.js
              '!README.md'                          // Exclude README.md
            ],
            dest:       'build/'
          }
        ]
      }
    },
    browserify: {
      options: {
        transform:  [reactify],   // Process JSX files with reactify
        watch:      true,         // Use watchify (caching modules)
        keepAlive:  false,
        external:   COMMON_MODULES,
        browserifyOptions: {
          debug:      true,
          externalRequireName: 'require',
          fullPaths:    false,    // Set this false for newer versions
          extensions:   ['.jsx']  // Makes require() look for .jsx files
        }
      },
      common: {
        options: {
          external: [],
          require:  COMMON_MODULES
        },
        src:    [],
        dest:   path.join('build', 'common.bundle.js')
      }
    },
    jade: {
      options: {
        pretty:     true
      }
    },
    less: {
      options: {
        sourceMapRootpath:    '/./',
        relativeUrls:         true,
        sourceMap:            true
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: 'build'
        }
      }
    },
    watch: {
      options: {
        spawn: false
      },
      assets: {
        files:  [
          '**',                                 // Copy everything
          // We might want to allow node_modules/ so that sourceMaps will
          // work
          '!node_modules/**', '!node_modules',  // Exclude node_modules/
          '!.git', '!.git/**', '!.git/*',       // Exclude .git/
          '!build/**', '!build',                // Exclude build/
          '!package.json',                      // Exclude package.json
          '!Gruntfile.js',                      // Exclude Gruntfile.js
          '!README.md'                          // Exclude README.md
        ]
      },
      jade: {
        tasks:  ['jade'],
        files:  ['**/*.jade', '!node_modules/**', '!build/**']
      },
      less: {
        tasks:  ['less'],
        files:  ['**/*.less', '!node_modules/**', '!build/**']
      },
      Gruntfile: {
        options: {
          reload: true
        },
        files:  [ 'Gruntfile.js', 'build-files.js']
      }
    },
    clean: [
      "build/"
    ]
  };

  var files = require('./build-files');

  // Compile Javascript files with browserify
  files
     .filter(RegExp.prototype.test.bind(/\.jsx?$/))
     .map(path.relative.bind(path, __dirname))
     .forEach(function(file) {
    config.browserify[file] = {
      src:    './' + file,  // './' is necessary to load a local module
      dest:   path.join('build', file.replace(/\.jsx?$/, '.bundle.js'))
    };
  });
  // return console.log(JSON.stringify(config.browserify, null, 2));

  // Compile Jade files
  files
     .filter(RegExp.prototype.test.bind(/\.jade$/))
     .map(path.relative.bind(path, __dirname))
     .forEach(function(file) {
    // Rule for compiling the file with jade
    config.jade[file] = {
      src:    file,
      dest:   path.join('build', file.replace(/\.jade$/, '.html'))
    };
  });

  // Compile less files
  files
     .filter(RegExp.prototype.test.bind(/\.less$/))
     .map(path.relative.bind(path, __dirname))
     .forEach(function(file) {
    // Rule for compiling the file with less
    config.less[file] = {
      src:    file,
      dest:   path.join('build', file.replace(/\.less$/, '.css')),
      options: {
        sourceMapFilename:  path.join('build', file.replace(/\.less$/, '.css.map')),
        sourceMapURL:       path.join('/', file.replace(/\.less$/, '.css.map'))
      }
    };
  });

  // Copy over files to build/ as they are changed
  grunt.event.on('watch', function(action, filepath, target) {
    if (/^(\.|^node_modules(\/|$)|build(\/|$))/.test(filepath)) {
      return;
    }
    if (target === 'assets') {
      console.log("COPY: %s -> %s", filepath, path.join('build', filepath));
      grunt.file.copy(filepath, path.join('build', filepath));
    }
  });

  // Initialize grunt config
  grunt.initConfig(config);

  // Load tasks from npm
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Register tasks
  grunt.registerTask('default', ['build', 'connect', 'watch']);
  grunt.registerTask('build',   ['copy', 'jade', 'less', 'browserify']);
};
