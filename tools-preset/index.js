const rpWeb = require('neutrino-preset-mozilla-rpweb');
const env = require('neutrino-middleware-env');
const webpack = require('webpack');

module.exports = neutrino => {
  const envs = {
    CORS_PROXY: 'https://cors-proxy.taskcluster.net/request',
    UPTIMEROBOT_API_KEY_QUEUE: 'm776323830-a170e7abc854f94cc2f4c078',
    UPTIMEROBOT_API_KEY_AUTH: 'm776208480-28abc3b309cb0e526a5ebce8',
    UPTIMEROBOT_API_KEY_AWS_PROVISIONER: 'm776120201-37b5da206dfd8de4b00ae25b',
    UPTIMEROBOT_API_KEY_EVENTS: 'm776321033-e82bb32adfa08a0bba0002c6',
    UPTIMEROBOT_API_KEY_INDEX: 'm776362434-85a6996de0f9c73cf21bbf89',
    UPTIMEROBOT_API_KEY_SCHEDULER: 'm776120202-44923d8660c2a1bd1a5de440',
    UPTIMEROBOT_API_KEY_SECRETS: 'm777577313-6d58b81186c4064cf7a8d1e1',
    SIGN_IN_METHODS: process.env.NODE_ENV === 'development' ? 'development' : 'okta email manual'
  };

  // Set environment variables to their default values if not defined
  Object
    .keys(envs)
    .forEach(env => !process.env[env] && (process.env[env] = envs[env]));

  neutrino.options.html = {
    title: 'TaskCluster Tools',
    googleAnalytics: {
      trackingId: 'UA-49796218-12',
      pageViewOnLoad: true
    },
    mobile: true,
    meta: [
      {
        name: 'description',
        content: `A collection of tools for TaskCluster components and elements in the TaskCluster ecosystem. Here
          you'll find tools to manage TaskCluster as well as run, debug, inspect, and view tasks, task groups, and other
          TaskCluster related entities.`
      },
      {
        name: 'author',
        content: 'Mozilla TaskCluster Team'
      }
    ]
  };

  neutrino.use(rpWeb);
  neutrino.use(env, Object.keys(envs));

  neutrino.config.module.rules.delete('lint');

  // Fix issue with nested routes e.g /index/garbage
  neutrino.config.output.publicPath('/');
  neutrino.config.node.set('Buffer', true);

  neutrino.config.module
    .rule('style')
    .test(/\.less$/)
    .use('less')
    .loader('less-loader')
    .options({
      'noIeCompat': true
    });

  // The JSONStream module's main file has a Node.js shebang, which Webpack doesn't like loading as JS
  neutrino.config.module
    .rule('shebang')
    .test(/JSONStream/)
    .use('shebang')
    .loader('shebang-loader');

  // Make variables `$` and `jQuery` available
  neutrino.config
    .plugin('jquery')
    .use(webpack.ProvidePlugin, [{
      $: "jquery",
      jQuery: "jquery"
    }]);

  neutrino.config.externals(['bindings']);

  // Allow url to contain dot
  neutrino.config.when(process.env.NODE_ENV === 'development', config =>
    config.devtool('eval').devServer.historyApiFallback({ disableDotRule: true }));
};
