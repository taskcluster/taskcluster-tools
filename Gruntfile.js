var path      = require('path');
var babelify  = require('babelify');
var stream    = require('stream');
var exorcist  = require('exorcist');
var concat    = require('concat-stream')

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
  'rison',
  // global modules too
  'url',
  'querystring',
  'path',
  'assert'
];

/** Create an function split source maps put in post bundle callback */
var wrapExorcist = function(dest) {
  return function(err, src, next) {
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(src);
    s.push(null);
    s.pipe(exorcist(dest))
     .pipe(concat({encoding: 'string'}, function(data) {
      next(err, data);
    }));
  };
};


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
        transform:  [
          // Process JSX files with babelify
          [babelify, {stage: 1}]
        ],
        watch:      true,         // Use watchify (caching modules)
        keepAlive:  false,
        external:   COMMON_MODULES,
        browserifyOptions: {
          debug:      true,
          externalRequireName: 'require',
          fullPaths:    false,    // Set this false for newer versions
          extensions:   ['.jsx', '.js']  // Makes require() look for .jsx files
        }
      },
      common: {
        options: {
          external:       [],
          require:        COMMON_MODULES,
          postBundleCB:   wrapExorcist(
                            path.join('build', 'common.bundle.js.map')
                          )
        },
        src:    [require.resolve('babelify/polyfill')],
        dest:   path.join('build', 'common.bundle.js')
      }
    },
    jade: {
      options: {
        pretty:               true  // Pretty print HTML
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
        spawn:                false,
        debounceDelay:        250
      },
      assets: {
        files:  [
          '**',                                 // Copy everything
          // We want to allow node_modules/ so that sourceMaps will
          // work, but we can't reliably watch it as the system runs out of
          // file descriptors
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
    ],
    s3: {
      options: {
        // Get AWS credentials from environment
        accessKeyId:        process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:    process.env.AWS_SECRET_ACCESS_KEY,
        bucket:             'taskcluster-tools',
        region:             'us-west-2',
        sslEnabled:         true,
        maxRetries:         10,
        concurrency:        30,
        overwrite:          true,
        cacheTTL:           0,
        gzip:               true,
        dryRun:             false,
        headers: {
          CacheControl:     'public, must-revalidate, proxy-revalidate, max-age=0'
        }
      },
      text: {
        options: {
          charset:          'utf-8',
        },
        cwd:                'build/',
        src:                [
          '**/*.html',    '**/*.jade',
          '**/*.js',      '**/*.js.map',      '**/*.jsx',
          '**/*.css',     '**/*.css.map',     '**/*.less',
          '**/*.svg',     '**/*.json'
        ],
      },
      binary: {
        cwd:                'build/',
        src:                [
          '**',
          '!**/*.html',   '!**/*.jade',
          '!**/*.js',     '!**/*.js.map',     '!**/*.jsx',
          '!**/*.css',    '!**/*.css.map',    '!**/*.less',
          '!**/*.svg',    '!**/*.json'
        ],
      }
    },
    concurrent: {
      options: {
        limit:                      999999 // We use concurrent to watch things
      },
      build: {
        options: {
          logConcurrentOutput:      false
        },
        tasks:    ['copy', 'jade', 'less']
      },
      develop: {
        options: {
          logConcurrentOutput:      true
        },
        tasks:    ['server', 'watch-browserify', 'watch']
      }
    }
  };
  // Tasks used by concurrent to create a develop that is nicely concurrent
  grunt.registerTask('server',            ['connect',    'keepalive']);
  grunt.registerTask('watch-browserify',  ['browserify', 'keepalive']);

  // Register tasks
  grunt.registerTask('default', ['develop']);
  grunt.registerTask(
    'build',
    "Build sources into the build/ folder",
    ['copy', 'jade', 'less', 'browserify']
  );
  grunt.registerTask(
    'develop',
    "build, watch and serve on localhost:9000",
    ['concurrent:build', 'concurrent:develop']
  );
  grunt.registerTask(
    'publish',
    "Build and upload to tools.taskcluster.net",
    ['clean', 'build', 's3']
  );
  grunt.registerTask(
    'develop-safe-mode',
    "develop with single grunt process",
    ['build', 'connect', 'watch']
  );

  var files = require('./build-files');

  // Compile Javascript files with browserify
  files
     .filter(RegExp.prototype.test.bind(/\.jsx?$/))
     .map(path.relative.bind(path, __dirname))
     .forEach(function(file) {
    var target = path.join('build', file.replace(/\.jsx?$/, '.bundle.js'));
    config.browserify[file] = {
      src:              './' + file,  //'./' is necessary to load a local module
      dest:             target,
      options: {
        postBundleCB:   wrapExorcist(target + '.map')
      }
    };
  });

  // Compile Jade files
  files
     .filter(RegExp.prototype.test.bind(/\.jade$/))
     .map(path.relative.bind(path, __dirname))
     .forEach(function(file) {
    // Rule for compiling the file with jade
    var relRoot = path.relative(path.dirname(file), '.');
    config.jade[file] = {
      options: {
        data: {
          relPath:  function(absPath) {
            //
            return path.relative(path.dirname(file), absPath);
            // Return relative path for absolute path
            //return path.join(relRoot, absPath);
          }
        }
      },
      src:        file,
      dest:       path.join('build', file.replace(/\.jade$/, '.html'))
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
  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-keepalive');
  grunt.loadNpmTasks('grunt-concurrent');
};
