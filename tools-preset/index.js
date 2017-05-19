const env = require('./env');
const DefinePlugin = require('webpack').DefinePlugin;
const HtmlPlugin = require('html-webpack-plugin');
const path = require('path');

const SRC = path.join(__dirname, '../src');
const template = path.join(SRC, 'template.ejs');

module.exports = neutrino => {
  // Turn off HMR
  neutrino.config.entry('index').delete('webpack/hot/dev-server');
  neutrino.config.plugins.delete('hot');
  neutrino.config.devServer.hot(false);

  // Async Await
  neutrino.config.entry('index').prepend('babel-polyfill');

  // LESS
  neutrino.config.module
    .rule('style')
    .test(/\.less$/)
    .use('less')
    .loader('less-loader')
    .options({
      'noIeCompat': true
    });

  // Environment variables
  neutrino.config
    .plugin('env')
    .use(DefinePlugin, [{ 'process.env': env }]);

  // Template
  neutrino.config
    .plugin('html')
    .use(HtmlPlugin, [{
      template,
      inject: true,
      appMountId: 'root',
      xhtml: true,
      mobile: true,
      minify: {
        useShortDoctype: true,
        keepClosingSlash: true,
        collapseWhitespace: true,
        preserveLineBreaks: true
      }
    }]);

  // Fix issue with nested routes e.g /index/garbage
  neutrino.config.output.publicPath('/');

  // The JSONStream module's main file has a Node.js shebang, which Webpack doesn't like loading as JS
  neutrino.config.module
    .rule('json')
    .test(/JSONStream/)
    .use('shebang')
    .loader('shebang-loader');

  // Don't parse the ws module as it seems to blow up Webpack
  // neutrino.config.module.noParse.add(/ws/);

  // Allow url to contain dot
  neutrino.config.devServer.historyApiFallback({ disableDotRule: true });
};
