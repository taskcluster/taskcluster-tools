'use strict';

const preset = require('neutrino-preset-react');
const clone = require('lodash.clonedeep');

// Create a loader for LESS files which just extends the CSS loader with using the less-loader
const cssLoader = preset.module.loaders.find(l => /css/.test(l.test));
const lessLoader = clone(cssLoader);

lessLoader.test = /\.less$/;
lessLoader.loaders.push(require.resolve('less-loader'));

module.exports = lessLoader;
