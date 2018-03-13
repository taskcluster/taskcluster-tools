const merge = require('deepmerge');
const { ProvidePlugin } = require('webpack');
const GitRevisionPlugin = require('git-revision-webpack-plugin');

// Increment the version whenever you need a full invalidation
// but hashes could remain the same
const CACHE_VERSION = 'v1';

process.env.COMMIT_HASH = new GitRevisionPlugin().commithash()

module.exports = {
  use: [
    ['neutrino-preset-mozilla-frontend-infra', {
      cacheVersion: CACHE_VERSION,
      eslint: {
        rules: {
          // TODO: Too much work to convert right now
          'react/no-array-index-key': 'off',
          'jsx-a11y/label-has-for': 'off',
          'jsx-a11y/alt-text': 'off'
        },
      },
      react: {
        minify: {
          style: false,
          image: false,
        },
        devServer: {
          port: 9000,
          historyApiFallback: { disableDotRule: true }
        },
        html: {
          title: 'Taskcluster Tools',
          mobile: true,
          meta: [
            {
              name: 'description',
              content: `A collection of tools for Taskcluster components and elements in the Taskcluster ecosystem. Here
                you'll find tools to manage Taskcluster as well as run, debug, inspect, and view tasks, task groups, and
                other Taskcluster related entities.`
            },
            {
              name: 'author',
              content: 'Mozilla Taskcluster Team'
            }
          ]
        }
      }
    }],
    ['@neutrinojs/env', [
      'NODE_ENV',
      'APPLICATION_NAME',
      'AUTH0_DOMAIN',
      'AUTH0_CLIENT_ID',
      'AUTH0_AUDIENCE',
      'SIGN_IN_METHODS',
      'COMMIT_HASH'
    ]],
    (neutrino) => {
      // Fix issue with nested routes e.g /index/garbage
      neutrino.config.output.publicPath('/');
      neutrino.config.node.set('Buffer', true);

      // The JSONStream module's main file has a Node.js shebang
      // which Webpack doesn't like loading as JS
      neutrino.config.module
        .rule('shebang')
          .test(/JSONStream/)
          .use('shebang')
            .loader('shebang-loader');

      neutrino.config
        .externals(merge(neutrino.config.get('externals'), {
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
          'babel-polyfill',
          'deepmerge',
          'lodash.chunk',
          'lodash.clonedeep',
          'prop-types',
          'ramda',
          'markdown-it',
          'highlight.js',
          'moment',
          'qs',
          'react',
          'react-tooltip',
          'react-bootstrap',
          'react-loadable',
          'react-fontawesome',
          'react-router-bootstrap',
          'slugid',
          'react-dom',
          'react-helmet',
          'react-router-dom',
          'taskcluster-client-web'
        ]);
    }
  ],
};
