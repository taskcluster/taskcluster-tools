'use strict';

const HtmlPlugin = require('html-webpack-plugin');
const path = require('path');
const preset = require('neutrino-preset-taskcluster-web');

const SRC = path.join(__dirname, '../src');
const polyfill = require.resolve('babel-polyfill');
const template = path.join(SRC, 'template.ejs');

const entryPoints = [
  'ami-sets',
  'auth/clients',
  'auth/roles',
  'auth/scopes',
  'aws-provisioner',
  'credentials',
  'diagnostics',
  'display',
  'exchange-inspector',
  'hooks',
  'index',
  'index/artifacts',
  'interactive',
  'login',
  'one-click-loaner',
  'one-click-loaner/connect',
  'pulse-inspector',
  'purge-caches',
  'push-inspector', // this page redirects to task-group-inspector
  'secrets',
  'shell',
  'status',
  'task-creator',
  'task-graph-inspector', // this page redirects to task-group-inspector
  'task-group-inspector',
  'task-inspector'
];

/**
 * For each entry point, create an entry in a hash which determines the location of the entry point,
 * what files start it up, and optionally hot reloading via the webpack-dev-server
 */
const entry = file => {
  const definition = [
    polyfill,
    `./src/${file}`
  ];

  return process.env.NODE_ENV === 'development' ?
    definition.concat([`webpack-dev-server/client?http://localhost:${preset.devServer.port}`]) :
    definition;
};

const plugins = [];

/**
 * The root preset is the index landing page, which has a different file structure than the other
 * pages. The reason this is special is because there is already a directory called index, which
 * can't be used to generate an index.html.
 */
plugins.push(new HtmlPlugin({
  template,
  hash: true,
  xhtml: true,
  chunks: ['commons', 'root'],
  filename: 'index.html'
}));

/**
 * For the list of entries in entryPoints, create a hash which points to the location of the file,
 * the index.html file we are generating, and the shared JavaScript chunks that are to be included
 * with the page's bundle.
 */
module.exports.entries = entryPoints.reduce((entries, entryPoint) => {
  const location = `${entryPoint}/index`;

  // TODO: Remove all app.jsx files and favor an index.js entry-point
  entries[location] = entry(path.join(entryPoint, 'app.jsx'));
  plugins.push(new HtmlPlugin({
    template,
    hash: true,
    xhtml: true,
    // The commons chunk is generated by the CommonsChunkPlugin in neutrino-preset-web, and should
    // include all the vendor JavaScript and shared code between pages.
    chunks: ['commons', location],
    filename: path.join(entryPoint, 'index.html')
  }));

  return entries;
}, { root: entry('landingpage.jsx') });

module.exports.plugins = plugins;
