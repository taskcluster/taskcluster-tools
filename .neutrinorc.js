const merge = require('deepmerge');
const { ProvidePlugin } = require('webpack');

const envs = {
  AUTH0_DOMAIN: 'auth.mozilla.auth0.com',
  AUTH0_CLIENT_ID: 'TBD',
  AUTH0_AUDIENCE: 'login.taskcluster.net',
  SIGN_IN_METHODS: process.env.NODE_ENV === 'development' ? 'development' : 'okta email manual'
};

// Set environment variables to their default values if not defined
Object
  .keys(envs)
  .forEach(env => !(env in process.env) && (process.env[env] = envs[env]));

module.exports = {
  use: [
    ['neutrino-preset-mozilla-rpweb', {
      eslint: {
        baseConfig: {
          extends: [
            'eslint-config-prettier'
          ]
        },
        plugins: ['eslint-plugin-prettier'],
        rules: {
          'prettier/prettier': ['error', {
            singleQuote: true,
            trailingComma: 'none',
            bracketSpacing: true,
            jsxBracketSameLine: true
          }],
          'consistent-return': 'off',
          'no-unused-expressions': 'off',
          'no-shadow': 'off',
          'no-return-assign': 'off',
          'babel/new-cap': 'off',
          'no-mixed-operators': 'off',
          'react/jsx-closing-bracket-location': 'off',
          'react/jsx-indent': 'off'
        }
      },
      react: {
        hot: false,
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
    ['neutrino-middleware-env', Object.keys(envs)],
    (neutrino) => {
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
  env: {
    NODE_ENV: {
      development: ({ config }) => config.devtool('eval'),
      production: ({ config }) => config.when(process.env.CI === 'true',
        (config) => config.devtool(false),
        (config) => config.devtool('source-map'))
    }
  }
};
