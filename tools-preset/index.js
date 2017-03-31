const env = require('./env');
const DefinePlugin = require('webpack').DefinePlugin;
const path = require('path');

module.exports = neutrino => {
  // Turn off HMR
  neutrino.config.entry('index').delete('webpack/hot/dev-server');
  neutrino.config.plugins.delete('hot');
  neutrino.config.devServer.hot(false);

  // Async Await
  neutrino.config.entry('index').prepend('babel-polyfill');

  // LESS
  neutrino.config.module
    .rule('css')
    .test(/\.less$/)
    .loader('less', 'less-loader', {
      "noIeCompat": true
    });

  // Environment variables
  neutrino.config
    .plugin('env')
    .use(DefinePlugin, { 'process.env': env });

  // Fix issue with nested routes e.g /index/garbage
  neutrino.config.output.publicPath('/');

  // The JSONStream module's main file has a Node.js shebang, which Webpack doesn't like loading as JS
  neutrino.config.module
    .rule('json')
    .test(/JSONStream/)
    .loader('shebang', 'shebang-loader');

  // Don't parse the ws module as it seems to blow up Webpack
  // neutrino.config.merge({
  //   module: {
  //     noParse: /ws/
  //   }
  // });

  // Allow url to contain dot
  neutrino.config.devServer.historyApiFallback({ disableDotRule: true });
};
