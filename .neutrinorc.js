const env = require('neutrino-middleware-env');
const { ProvidePlugin } = require('webpack');

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
  .forEach(env => !(env in process.env) && (process.env[env] = envs[env]));

module.exports = {
  use: [
    ['neutrino-preset-mozilla-rpweb', {
      react: {
        hot: false,
        devServer: {
          port: 9000,
          historyApiFallback: { disableDotRule: true }
        },
        // babel: {
        //   env: {
        //     production: {
        //       presets: [require.resolve('babel-preset-babili')]
        //     }
        //   }
        // },
        html: {
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
                you'll find tools to manage TaskCluster as well as run, debug, inspect, and view tasks, task groups, and
                other TaskCluster related entities.`
            },
            {
              name: 'author',
              content: 'Mozilla TaskCluster Team'
            }
          ]
        }
      }
    }],
    ['neutrino-middleware-env', Object.keys(envs)],
    (neutrino) => {
      neutrino.config.module.rules.delete('lint');
      neutrino.config.plugins.delete('minify');

      // Fix issue with nested routes e.g /index/garbage
      neutrino.config.output.publicPath('/');
      neutrino.config.node.set('Buffer', true);

      neutrino.config.module
        .rule('plain-style')
          .test(/\.css$/)
          .include
            .add(neutrino.options.node_modules).end()
          .use('style')
            .loader(require.resolve('style-loader'))
            .end()
          .use('css')
              .loader(require.resolve('css-loader'));

      neutrino.config.module
        .rule('style')
          .exclude
            .add(neutrino.options.node_modules).end()
          .use('css')
            .options({ modules: true });

      // The JSONStream module's main file has a Node.js shebang, which Webpack doesn't like loading as JS
      neutrino.config.module
        .rule('shebang')
          .test(/JSONStream/)
          .use('shebang')
            .loader('shebang-loader');

      neutrino.config
        .externals(Object.assign(neutrino.config.get('externals'), {
          bindings: 'bindings'
        }));

      // Make variables `$` and `jQuery` available
      neutrino.config
        .plugin('jquery')
          .use(ProvidePlugin, [{
            $: 'jquery',
            jQuery: 'jquery'
          }]);
      
      neutrino.config
        .entry('vendor')
        .merge([
          '@skidding/react-codemirror',
          'change-case',
          'classnames',
          'concat-stream',
          'exorcist',
          'highlight.js',
          'hterm-umd',
          'jquery',
          'js-yaml',
          'markdown-it',
          'moment',
          'qs',
          'ramda',
          'react',
          'react-bootstrap',
          'react-datepicker',
          'react-dom',
          'react-helmet',
          'react-json-inspector',
          'react-router-dom',
          'react-tabs',
          'react-tooltip',
          'react-treeview',
          'taskcluster-client',
          'www-authenticate',
          'xml2js'
        ]);
    }
  ],
  env: {
    NODE_ENV: {
      development: ({ config }) => config.devtool('eval')
    }
  }
};
