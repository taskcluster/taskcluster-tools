import React from 'react';
import _ from 'lodash';
import * as auth from './auth';
import createDebugger from 'debug';
import assert from 'assert';
import * as format from './format';
import taskcluster from 'taskcluster-client';
import rison from 'rison';
import * as bs from 'react-bootstrap';
import changeCase from 'change-case';

const debug = createDebugger('lib:utils');

/**
 * Given a JSON object `obj` and a path: ['key1', 'key2'] return
 * `obj.key1.key2` or undefined if the value doesn't exist
 */
const valueAtPath = (path, obj, index = 0) => {
  if (path.length === index) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return;
  }

  return valueAtPath(path, obj[path[index]], index + 1);
};

/**
 * Given a list of strings on the form ['key1.key2', 'key3'] return a list of
 * parsed keys where non-arrays are split by '.'
 */
const parsePaths = paths => paths.map(path => {
  if (Array.isArray(path)) {
    return path;
  }

  return path.split('.');
});

/**
 * Check if values at `paths` has changed between `obj1` and `obj2`.
 *
 * In this case `paths` is an array of paths on form:
 * `[['key1', 'key2'], ['key3']]` and `obj1` and `obj2` are objects, or really
 * anything they want to be.
 *
 * Note, the comparison will do a deep equals of the values found.
 */
const hasChanged = (paths, obj1, obj2) => {
  assert(Array.isArray(paths), 'paths must be an array');

  return paths.some(path => !_.isEqual(valueAtPath(path, obj1), valueAtPath(path, obj2)));
};

/**
 * Logic for loading state using taskcluster-client
 *
 * This component will dispatch the event
 * `taskcluster-reload` when:
 *  - `componentDidMount` triggers
 *  - A key in reloadOnKeys changes
 *  - Credentials change given `reloadOnLogin` option is set to true
 *
 *  `taskcluster-update` when:
 *  - state changes i.e., when key is resolved/rejects
 *
 * Implementors can call `loadState({key: promise})` with a mapping from key to promise.
 * example: this.props.loadState({key: promise})
 *
 * When a promise is successful state will be set as follows:
 * {
 *   keyLoaded:   true,
 *   keyError:    undefined,
 *   key:         result from promise
 * }
 *
 * If a promise is resolved unsuccessfully state will be set as follows:
 * {
 *   keyLoaded:   true,
 *   keyError:    Error Object,
 *   key:         undefined
 * }
 *
 * While a promise is waiting to be resolved state will be set as follows:
 * {
 *   keyLoaded:   false,
 *   keyError:    undefined,
 *   key:         undefined
 * }
 *
 */
export const TaskClusterEnhance = (Component, opts) => (
  class extends React.Component {
    constructor(props) {
      super(props);

      this.options = {
        clients: {}, // Mapping from name to clientClass
        clientOpts: {}, // Mapping from name to client options
        reloadOnProps: [], // List of properties to reload on
        reloadOnKeys: [], // List of state keys to reload on
        reloadOnLogin: false, // Reload when credentials are changed
        name: '', // Name of wrapped component
        ...opts,
      };

      assert(Array.isArray(this.options.reloadOnProps), 'reloadOnProps must be an array');
      assert(Array.isArray(this.options.reloadOnKeys), 'reloadOnKeys must be an array');

      this.options.reloadOnKeys = parsePaths(this.options.reloadOnKeys);
      this.options.reloadOnProps = parsePaths(this.options.reloadOnProps);

      this.clients = {};
      this.state = {};

      this.componentProps = {};
      this.componentKeys = {};

      this.handleCredentialsChanged = this.handleCredentialsChanged.bind(this);
      this.renderWaitFor = this.renderWaitFor.bind(this);
      this.loadState = this.loadState.bind(this);
      this.taskclusterState = this.taskclusterState.bind(this);
    }

    componentWillMount() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());
    }

    componentDidMount() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());
      // Listen for changes to credentials
      window.addEventListener('credentials-changed', this.handleCredentialsChanged, false);
      // Initial load
      this.reload();
    }

    /** Reload if props/keys change */
    taskclusterState(keys, props) {
      if ((keys && hasChanged(this.options.reloadOnKeys, keys, this.componentKeys)) ||
        (props && hasChanged(this.options.reloadOnProps, props, this.componentProps))) {
        this.reload(this.options.name);
      }

      this.componentKeys = keys;
      this.componentProps = props;
    }

    /** handle changes to credentials */
    handleCredentialsChanged(e) {
      // Update clients with new credentials
      this._createClients(e.detail);
      this.setState({createdTaskIdError: null}, this.updateWrappedState);

      if (this.options.reloadOnLogin) {
        // Reload state now that we have new credentials
        this.reload();
      }
    }

    /** Stop listening for events */
    componentWillUnmount() {
      window.removeEventListener('credentials-changed', this.handleCredentialsChanged, false);
    }

    /** Load state from a map from property to promise */
    loadState(promisedState) {
      assert(promisedState instanceof Object, 'Expected an object');

      // map from promised state property to load iteration count, so that old
      // loads that are resolved after newer requests aren't overwriting newer
      // state information
      if (this.__promisedStateIterationMap === undefined) {
        this.__promisedStateIterationMap = {};
      }

      // Construct and set initial state and construct current
      // promisedStateIterationMap
      const promisedStateIterationMap = {};
      const state = {};

      _.forIn(promisedState, (promise, key) => {
        // Set loading state
        state[`${key}Loaded`] = false;
        state[`${key}Error`] = undefined;
        state[key] = undefined;

        // Ensure that there is already an iteration
        if (this.__promisedStateIterationMap[key] === undefined) {
          this.__promisedStateIterationMap[key] = 0;
        }

        // Create a new iteration
        this.__promisedStateIterationMap[key] += 1;
        // Remember the current iteration
        promisedStateIterationMap[key] = this.__promisedStateIterationMap[key];
      });

      this.setState(state, this.updateWrappedState);

      // Construct a method that'll set state loaded and ignore old state if
      // a new promise for the property has arrived since
      const setLoaded = (key, result, err) => {
        // Ignore state, if loadState have been called again with this property
        const currentIteration = this.__promisedStateIterationMap[key];

        if (promisedStateIterationMap[key] === currentIteration) {
          this.setState({
            [`${key}Loaded`]: true,
            [`${key}Error`]: err,
            [key]: result,
          }, this.updateWrappedState);
        }
      };

      // Update state as promises are resolved
      const promises = _.map(promisedState, (promise, key) => Promise
        .resolve(promise)
        .then(result => {
          // Set result state
          setLoaded(key, result);
        }, err => {
          debug('Error loading \'%s\', err: %s, as JSON: %j', key, err, err, err.stack);
          // Set error state
          setLoaded(key, undefined, err || new Error('Unknown Error'));
        }));

      // Return promise when all promises are resolved
      return Promise
        .all(promises)
        .then(() => {})
        .catch(err => {
          throw err;
        });
    }

    reload(name) {
      document.dispatchEvent(new CustomEvent('taskcluster-reload', {detail: {name}}));
    }

    updateWrappedState() {
      document.dispatchEvent(new CustomEvent('taskcluster-update', {detail: this.state}));
    }

    /**
     * Render a spinner or error message if `property` isn't loaded
     * this assume that `property` is loaded through `load()`. Hence, state
     * should have properties:
     * {<property>Loaded, <property>Error, <property>}
     *
     * Returns undefined if the property is loaded.
     */
    renderWaitFor(property) {
      if (this.state[`${property}Loaded`]) {
        if (this.state[`${property}Error`]) {
          return this.renderError(this.state[`${property}Error`]);
        }
      } else {
        return this.renderSpinner();
      }
    }

    /** Render a spinner */
    renderSpinner() {
      return (
        <div style={{textAlign: 'center', margin: 20}}>
          <format.Icon name="spinner" size="2x" spin={true} />
        </div>
      );
    }

    /**
     * Error object, assumed to have message and possible properties from
     * taskcluster-client
     */
    renderError(err) {
      // Find some sort of summary or error code
      let code = 'Unknown Error';

      if (err.code) {
        code = `${changeCase.titleCase(err.code.replace('Error', ''))} Error!`;
      } else if (err.statusCode) {
        code = `HTTP ${err.statusCode}`;
      }

      // Find if user is logged out and error code is 403
      const loggedOut403 = !auth.hasCredentials() && err.statusCode === 403;

      // Find some sort of message
      const message = err.message ?
        err.message.slice(0, err.message.search('----')) :
        `\`\`\`\n${err.stack}\n\`\`\``;
      const title = <bs.Button>Additional details...</bs.Button>;

      return (
        loggedOut403 ? (
          <bs.Alert bsStyle="info">
            <p>
              You are not authorized to perform the requested action. Please sign in and try again.
            </p>
          </bs.Alert>
        ) : (
          <bs.Alert bsStyle="danger">
            <strong>
              {code}&nbsp;
            </strong>
            <format.Markdown>{message}</format.Markdown>
            <format.Collapse title={title}>
              <pre>
                {JSON.stringify(err.body, null, 2)}
              </pre>
            </format.Collapse>
          </bs.Alert>
        )
      );
    }

    /** Initialize client objects requested in options */
    _createClients(credentials) {
      _.forIn(this.options.clients, (Client, key) => {
        this.clients[key] = new Client({credentials, ...this.options.clientOpts[key]});
      });
    }

    render() {
      return (
        <Component
          {...this.props}
          clients={this.clients}
          taskclusterState={this.taskclusterState}
          loadState={this.loadState}
          renderWaitFor={this.renderWaitFor}
          renderError={this.renderError}
          renderSpinner={this.renderSpinner} />
      )
    }
  }
);

/**
 * Logic for loading state using taskcluster-client
 *
 * Implementors can provide:
 *   - `load()` returns a map from key to state,
 *     example: `{key: promise}`.
 *
 * Implementors can also call `loadState({key: promise})` with a mapping
 * from key to promise.
 *
 * When a promise is successful state will be set as follows:
 * {
 *   keyLoaded:   true,
 *   keyError:    undefined,
 *   key:         result from promise
 * }
 *
 * If a promise is resolved unsuccessfully state will be set as follows:
 * {
 *   keyLoaded:   true,
 *   keyError:    Error Object,
 *   key:         undefined
 * }
 *
 * While a promise is waiting to be resolved state will be set as follows:
 * {
 *   keyLoaded:   false,
 *   keyError:    undefined,
 *   key:         undefined
 * }
 *
 * When rendering `!propertyLoaded` will be true if it either haven't started
 * loading or is loading.
 */
export const createTaskClusterMixin = opts => {
  // Set default options
  const options = {
    clients: {}, // Mapping from name to clientClass
    clientOpts: {}, // Mapping from name to client options
    reloadOnProps: [], // List of properties to reload on
    reloadOnKeys: [], // List of state keys to reload on
    reloadOnLogin: false, // Reload when credentials are changed
    ...opts,
  };

  assert(Array.isArray(options.reloadOnProps), 'reloadOnProps must be an array');
  assert(Array.isArray(options.reloadOnKeys), 'reloadOnKeys must be an array');

  options.reloadOnProps = parsePaths(options.reloadOnProps);
  options.reloadOnKeys = parsePaths(options.reloadOnKeys);

  return {
    componentWillMount() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());
    },

    /** Setup object and start listening for events */
    componentDidMount() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());
      // Listen for changes to credentials
      window.addEventListener('credentials-changed', this.handleCredentialsChanged, false);
      // Reload state (initial load)
      this.reload();
    },

    /** Check if the props or state changes causes us to reload */
    componentDidUpdate(prevProps, prevState) {
      // Reload state if we have to
      if (hasChanged(options.reloadOnProps, this.props, prevProps) ||
        hasChanged(options.reloadOnKeys, this.state, prevState)) {
        this.reload();
      }
    },

    /** handle changes to credentials */
    handleCredentialsChanged(e) {
      // Update clients with new credentials
      this._createClients(e.detail);
      this.setState({createdTaskIdError: null});

      if (options.reloadOnLogin) {
        // Reload state now that we have new credentials
        this.reload();
      }
    },

    /** Stop listening for events */
    componentWillUnmount() {
      // Remove credentials-changed event handler
      window.removeEventListener('credentials-changed', this.handleCredentialsChanged, false);
    },

    /** Load state from a map from property to promise */
    loadState(promisedState) {
      assert(promisedState instanceof Object, 'Expected an object');

      // map from promised state property to load iteration count, so that old
      // loads that are resolved after newer requests aren't overwriting newer
      // state information
      if (this.__promisedStateIterationMap === undefined) {
        this.__promisedStateIterationMap = {};
      }

      // Construct and set initial state and construct current
      // promisedStateIterationMap
      const promisedStateIterationMap = {};
      const state = {};

      _.forIn(promisedState, (promise, key) => {
        // Set loading state
        state[`${key}Loaded`] = false;
        state[`${key}Error`] = undefined;
        state[key] = undefined;

        // Ensure that there is already an iteration
        if (this.__promisedStateIterationMap[key] === undefined) {
          this.__promisedStateIterationMap[key] = 0;
        }

        // Create a new iteration
        this.__promisedStateIterationMap[key] += 1;
        // Remember the current iteration
        promisedStateIterationMap[key] = this.__promisedStateIterationMap[key];
      });

      this.setState(state);

      // Construct a method that'll set state loaded and ignore old state if
      // a new promise for the property has arrived since
      const setLoaded = (key, result, err) => {
        // Ignore state, if loadState have been called again with this property
        const currentIteration = this.__promisedStateIterationMap[key];

        if (promisedStateIterationMap[key] === currentIteration) {
          this.setState({
            [`${key}Loaded`]: true,
            [`${key}Error`]: err,
            [key]: result,
          });
        }
      };

      // Update state as promises are resolved
      const promises = _.map(promisedState, (promise, key) => Promise
        .resolve(promise)
        .then(result => {
          // Set result state
          setLoaded(key, result);
        }, err => {
          debug('Error loading \'%s\', err: %s, as JSON: %j', key, err, err, err.stack);
          // Set error state
          setLoaded(key, undefined, err || new Error('Unknown Error'));
        }));

      // Return promise all promises are resolved
      return Promise
        .all(promises)
        .then(() => {})
        .catch(err => {
          throw err;
        });
    },

    /** Reload state given properties to reload with */
    reload() {
      // If there is no `load` function then we're done
      if (!(this.load instanceof Function)) {
        return Promise.resolve();
      }

      // Get promised state
      const promisedState = this.load() || {};

      // If changes to any of these properties is in reloadOnKeys we'll create
      // an infinite loop, I hate those!
      const firstKeys = options.reloadOnKeys.map(_.first.bind(_));
      const conflictKeys = _.keys(promisedState)
        .filter(key => _.includes(firstKeys, key) ||
          _.includes(firstKeys, `${key}Error`) ||
          _.includes(firstKeys, `${key}Loaded`)
        );

      if (conflictKeys.length > 0) {
        debug('Keys that should not be in reloadOnKeys or not returned by load() are: %j',
          conflictKeys);
      }

      assert(conflictKeys.length === 0, `You cannot reload on keys that are returned by load(),
        this easily creates infinite loops`);

      // Load state from promised state given by this.load()
      return this.loadState(promisedState);
    },

    /**
     * Render a spinner or error message if `property` isn't loaded
     * this assume that `property` is loaded through `load()`. Hence, state
     * should have properties:
     * {<property>Loaded, <property>Error, <property>}
     *
     * Returns undefined if the property is loaded.
     */
    renderWaitFor(property) {
      if (this.state[`${property}Loaded`]) {
        if (this.state[`${property}Error`]) {
          return this.renderError(this.state[`${property}Error`]);
        }
      } else {
        return this.renderSpinner();
      }
    },

    /** Render a spinner */
    renderSpinner() {
      return (
        <div style={{textAlign: 'center', margin: 20}}>
          <object type="image/svg+xml" data="/lib/assets/taskcluster-spinner.svg">
            <format.Icon name="spinner" size="2x" spin={true} />
          </object>
        </div>
      );
    },

    /**
     * Error object, assumed to have message and possible properties from
     * taskcluster-client
     */
    renderError(err) {
      // Find some sort of summary or error code
      let code = 'Unknown Error';

      if (err.code) {
        code = `${changeCase.titleCase(err.code.replace('Error', ''))} Error!`;
      } else if (err.statusCode) {
        code = `HTTP ${err.statusCode}`;
      }

      // Find if user is logged out and error code is 403
      const loggedOut403 = !auth.hasCredentials() && err.statusCode === 403;

      // Find some sort of message
      const message = err.message ?
        err.message.slice(0, err.message.search('----')) :
        `\`\`\`\n${err.stack}\n\`\`\``;
      const title = <bs.Button>Additional details...</bs.Button>;

      return (
        loggedOut403 ? (
          <bs.Alert bsStyle="info">
            <p>
              You are not authorized to perform the requested action. Please sign in and try again.
            </p>
          </bs.Alert>
        ) : (
          <bs.Alert bsStyle="danger">
            <strong>
              {code}&nbsp;
            </strong>
            <format.Markdown>{message}</format.Markdown>
            <format.Collapse title={title}>
              <pre>
                {JSON.stringify(err.body, null, 2)}
              </pre>
            </format.Collapse>
          </bs.Alert>
        )
      );
    },

    /** Initialize client objects requested in options */
    _createClients(credentials) {
      _.forIn(options.clients, (Client, key) => {
        this[key] = new Client({credentials, ...options.clientOpts[key]});
      });
    },
  };
};

/**
 * Logic for listening to Pulse exchanges using WebListener
 *
 * To use this component you must implement the method
 * `this.bindings()` which returns a list of bindings to bind to.
 *
 * This component dispatches 2 type of events
 *  - `listener-message` when a message arrives
 *  - `listener-listening` when listener starts listening
 *
 * Implementors can call `startListening(bindings)` to set the bindings. In addition,
 * you can repeatedly invoke the latter to listen to additional bindings.
 * Calling `stopListening()` will clear all bindings and stop listening.
 * But if you  are implementing `this.bindings()` you should beware
 * that it'll will overwrite `startListening(bindings)`.
 *
 * This component adds the state property `listening` to state as follows:
 * {
 *    listening:    true || false || null // null when connecting
 * }
 */
export const CreateWebListener = (Component, opts) => (
  class extends React.Component {
    constructor(props) {
      super(props);

      this.options = {
        reloadOnProps: [], // List of properties to reload on
        reloadOnKeys: [], // List of state keys to reload on
        ...opts,
      };

      assert(this.options.reloadOnProps instanceof Array, 'reloadOnProps must be an array');
      assert(this.options.reloadOnKeys instanceof Array, 'reloadOnKeys must be an array');

      this.options.reloadOnProps = parsePaths(this.options.reloadOnProps);
      this.options.reloadOnKeys = parsePaths(this.options.reloadOnKeys);

      this.state = {
        listening: false,
        listeningError: null
      };

      this.componentKeys = {};
      this.componentProps = {};
      this.componentBindings = null;

      this.handleMessage = this.handleMessage.bind(this);
      this.startListening = this.startListening.bind(this);
      this.stopListening = this.stopListening.bind(this);
      this.listenerState = this.listenerState.bind(this);
    }

    componentDidMount() {
      this.__listener = null;
      this.__bindings = [];
      this.componentBindings = this.child.bindings;

      if (this.componentBindings instanceof Function) {
        this.startListening(this.componentBindings());
      }
    }

    /** Stop listening */
    componentWillUnmount() {
      this.stopListening();
    }

    listenerState(keys, props) {
      // No need to check state if this.child.bindings() isn't implemented
      if (!this.componentBindings instanceof Function) {
        return;
      }

      if ((keys && hasChanged(this.options.reloadOnKeys, keys, this.componentKeys) ||
        (props && hasChanged(this.options.reloadOnProps, props, this.componentProps)))) {
        this.listenerReload();
      }

      this.componentKeys = keys;
      this.componentProps = props;

    }

    /** Reload listener if bindings changed */
    listenerReload() {
      // Get new bindings
      const bindings = this.componentBindings();

      // Find bindings removed
      const bindingsRemoved = this.__bindings
        .filter(currentBinding => !bindings
          .some(binding => currentBinding.exchange === binding.exchange &&
          currentBinding.routingKeyPattern === binding.routingKeyPattern));

      // Find bindings added
      const bindingsAdded = bindings
        .filter(binding => !this.__bindings
          .some(currentBinding => currentBinding.exchange === binding.exchange &&
          currentBinding.routingKeyPattern === binding.routingKeyPattern));

      // bind to bindings
      if (bindingsRemoved.length > 0) {
        // At the moment weblistener can't unbind, so we have to create a new
        // listener... ie. stop/start listening
        this.stopListening();
        this.startListening(bindings);
      } else {
        this.startListening(bindingsAdded);
      }
    }

    // Dispatch listener message to subscriber
    handleMessage(message) {
      document.dispatchEvent(new CustomEvent('listener-message', {detail: message}));
    }

    /** Start listening */
    startListening(bindings) {
      // Get bindings if none are provided
      if (!bindings || bindings.length === 0) {
        return Promise.resolve();
      }
      // If not listening start listening
      if (!this.__listener) {
        assert(this.__bindings.length === 0, 'Hmm... check stopListening');
        // Create listener
        this.__listener = new taskcluster.WebListener();
        this.__listener.on('message', this.handleMessage);
        this.__listener.on('error', err => {
          debug('Error while listening: %s, %j', err, err);
          this.setState({listeningError: err || new Error('Unknown error')});
          this.stopListening();
        });

        // Bind to bindings
        const bound = bindings.map(binding => {
          this.__bindings.push(binding);
          return this.__listener.bind(binding);
        });

        this.setState({
          listening: null,
          listeningError: null,
        });

        return Promise
          .all(bound.concat([this.__listener.resume()]))
          .then(() => {
            debug('Listening for messages...');

            this.setState({
              listening: true,
              listeningError: null
            });

            // Notify that listener is listening
            document.dispatchEvent(new CustomEvent('listener-listening'));
          })
          .catch(err => {
            debug('Error while listening: %s, %j', err, err);
            this.setState({listeningError: err || new Error('Unknown error')});

            return this.stopListening();
          });
      }

      // Bind to all new bindings
      this.setState({
        listening: null,
        listeningError: null
      });

      return Promise
        .all(bindings.map(binding => {
          this.__bindings.push(binding);

          return this.__listener.bind(binding);
        }))
        .then(() => {
          this.setState({
            listening: true,
            listeningError: null,
          });

          // Notify that listener is listening
          document.dispatchEvent(new CustomEvent('listener-listening'));
        })
        .catch(err => {
          debug('Error while listening: %s, %j', err, err);
          this.setState({listeningError: err || new Error('Unknown error')});

          return this.stopListening();
        });
    }

    /** Stop listening, if already listening */
    stopListening() {
      this.setState({listening: false});

      if (this.__listener) {
        const closed = this.__listener.close();
        this.__listener = null;
        this.__bindings = [];

        return closed;
      }

      return Promise.resolve();
    }

    render() {
      return <Component
        {...this.props}
        {...this.state}
        ref={instance => {this.child = instance}}
        startListening={this.startListening}
        stopListening={this.stopListening}
        listenerState={this.listenerState} />;
    }
  }
);

/**
 * Logic for listening to Pulse exchanges using WebListener
 *
 * To use this mixin you must implement the method
 * `this.handleMessage(message)`, you can additionally opt to implement
 * `this.bindings()` which returns a list of bindings to bind to.
 *
 * options:
 * {
 *   reloadOnProps:     [], // Properties to reload bindings on
 *   reloadOnKeys:      []  // State keys to reload bindings on
 * }
 *
 * If `this.bindings()` is implemented it'll be called after mount and we will
 * bind to the bindings returned. In addition whenever a property or state key
 * specified in `reloadOnProps` and `reloadOnKeys`, respectively, is changed
 * bindings will be reconfigured based on `this.bindings()`, assuming it's
 * implemented.
 *
 * You can also use this mixin manually with the following methods:
 *  - `startListening(bindings)`
 *  - `stopListening()`
 *
 * You can call `startListening(bindings)` repeatedly to listen to additional
 * bindings. Calling `stopListening()` will clear all bindings and stop
 * listening. But if you  are implementing `this.bindings()` you should beware
 * that it'll will overwrite `startListening(bindings)`.
 *
 * This mixin adds the state property `listening` to state as follows:
 * {
 *    listening:    true || false || null // null when connecting
 * }
 * And calls `this.handleMessage(message)` when a message arrives.
 * When listening is started `this.listening()` will be called if it is
 * implemented.
 */
export const createWebListenerMixin = opts => {
  // Set default options
  const options = {
    reloadOnProps: [], // List of properties to reload on
    reloadOnKeys: [], // List of state keys to reload on
    ...opts,
  };

  assert(options.reloadOnProps instanceof Array, 'reloadOnProps must be an array');
  assert(options.reloadOnKeys instanceof Array, 'reloadOnKeys must be an array');

  options.reloadOnProps = parsePaths(options.reloadOnProps);
  options.reloadOnKeys = parsePaths(options.reloadOnKeys);

  return {
    /** Perform some sanity checks */
    componentWillMount() {
      assert(this.handleMessage instanceof Function,
        'components with this mixin must implement "handleMessage"');
    },

    /** Start listening if bindings are configured */
    componentDidMount() {
      this.__listener = null;
      this.__bindings = [];

      if (this.bindings instanceof Function) {
        this.startListening(this.bindings());
      }
    },

    /** Stop listening */
    componentWillUnmount() {
      this.stopListening();
    },

    /** Reload listener if bindings changed */
    componentDidUpdate(prevProps, prevState) {
      // No need to check state if this.bindings() isn't implemented
      if (!(this.bindings instanceof Function)) {
        return;
      }

      // Decide if we should reload listener
      if (!hasChanged(options.reloadOnProps, this.props, prevProps) &&
        !hasChanged(options.reloadOnKeys, this.state, prevState)) {
        return;
      }

      // Get new bindings
      const bindings = this.bindings();

      // Find bindings removed
      const bindingsRemoved = this.__bindings
        .filter(currentBinding => !bindings
          .some(binding => currentBinding.exchange === binding.exchange &&
            currentBinding.routingKeyPattern === binding.routingKeyPattern));

      // Find bindings added
      const bindingsAdded = bindings
        .filter(binding => !this.__bindings
          .some(currentBinding => currentBinding.exchange === binding.exchange &&
            currentBinding.routingKeyPattern === binding.routingKeyPattern));

      // bind to bindings
      if (bindingsRemoved.length > 0) {
        // At the moment weblistener can't unbind, so we have to create a new
        // listener... ie. stop/start listening
        this.stopListening();
        this.startListening(bindings);
      } else {
        this.startListening(bindingsAdded);
      }
    },

    /** Start listening */
    startListening(bindings) {
      // Get bindings if none are provided
      if (!bindings || bindings.length === 0) {
        return Promise.resolve();
      }

      // If not listening start listening
      if (!this.__listener) {
        assert(this.__bindings.length === 0, 'Hmm... check stopListening');
        // Create listener
        this.__listener = new taskcluster.WebListener();
        this.__listener.on('message', this.handleMessage);
        this.__listener.on('error', err => {
          debug('Error while listening: %s, %j', err, err);
          this.setState({listeningError: err || new Error('Unknown error')});
          this.stopListening();
        });

        // Bind to bindings
        const bound = bindings.map(binding => {
          this.__bindings.push(binding);
          return this.__listener.bind(binding);
        });

        this.setState({
          listening: null,
          listeningError: null,
        });

        return Promise
          .all(bound.concat([this.__listener.resume()]))
          .then(() => {
            debug('Listening for messages...');

            this.setState({
              listening: true,
              listeningError: null,
            });

            if (this.listening instanceof Function) {
              this.listening();
            }
          })
          .catch(err => {
            debug('Error while listening: %s, %j', err, err);
            this.setState({listeningError: err || new Error('Unknown error')});
            return this.stopListening();
          });
      }

      // Bind to all new bindings
      this.setState({
        listening: null,
        listeningError: null,
      });

      return Promise
        .all(bindings.map(binding => {
          this.__bindings.push(binding);
          return this.__listener.bind(binding);
        }))
        .then(() => {
          this.setState({
            listening: true,
            listeningError: null,
          });

          if (this.listening instanceof Function) {
            this.listening();
          }
        })
        .catch(err => {
          debug('Error while listening: %s, %j', err, err);
          this.setState({listeningError: err || new Error('Unknown error')});
          return this.stopListening();
        });
    },

    /** Stop listening, if already listening */
    stopListening() {
      this.setState({listening: false});

      if (this.__listener) {
        const closed = this.__listener.close();

        this.__listener = null;
        this.__bindings = [];

        return closed;
      }

      return Promise.resolve();
    },
  };
};

/** Escape a string for use in a regular expression */
const escapeForRegularExpression = string => string
  .replace(/[\-\[\]\/{}()*+?.\\\^$|]/g, '\\$&');

/** Apply a hexadecimal */
export const escapeChar = (character, string) => {
  assert(character.length === 1, 'character must have length 1');

  const regExp = new RegExp(escapeForRegularExpression(character), 'g');

  return string.replace(regExp, c => `%${c.charCodeAt(0).toString(16)}`);
};

/** Unescape a specific character, reversing escapeChar */
export const unescapeChar = (character, string) => {
  assert(character.length === 1, 'character must have length 1');

  const needle = `%${character.charCodeAt(0).toString(16)}`;
  const regExp = new RegExp(escapeForRegularExpression(needle), 'g');

  return string.replace(regExp, character);
};

/** Encode string for use in window.location.hash */
export const encodeFragment = string => string
  .replace(/[^a-zA-Z0-9!$&'()*+,;=:@\-._~?\/]/g, c => `%${c.charCodeAt(0).toString(16)}`);

/** Create HashEntry */
class HashEntry {
  constructor(index, hashState, manager) {
    this._index = index;
    this.hashState = hashState;
    this._handler = null;
    this.manager = manager;
  }

  /** Add handler and give HashState if not undefined */
  add(handler) {
    assert(this._handler === null, 'Cannot overwrite HashEntry handler!');

    this._handler = handler;

    if (this.hashState !== undefined) {
      this._handler(this.hashState);
    }
  }

  /** Remove handler and reset HashState */
  remove() {
    this._handler = null;

    if (this.hashState !== '') {
      this.hashState = '';
      this.manager.update();
    }
  }

  /** Get next HashEntry for the next index */
  next() {
    const index = this._index + 1;

    if (!this.manager._entries[index]) {
      this.manager._entries[index] = new HashEntry(index, this.manager._states[index],
        this.manager);
    }

    return this.manager._entries[index];
  }
}

/**
 * HashManager, handles persistence of state to location.hash
 *
 * This is exposed through createHashManager, do not export it by other means!
 * It's supposed to be a singleton, but only the first caller is supposed to get
 * a reference.
 *
 * The idea is that you get the first HashEntry from the manager, using
 * hashManager.root(), then whenever you want to add additional state under
 * a HashEntry you call hashEntry.next() to get the next HashEntry.
 * Each HashEntry can only be given to one component at any given time.
 * Components that implements the LocationHashMixin can be assigned the
 * hashEntry property.
 */
class HashManager {
  constructor(options) {
    this._options = {separator: '/', ...options};

    assert(this._options.separator.length === 1, 'Separator must have length 1');

    this._entries = [];
    // Initial state for new HashEntry instances
    this._states = [];
    this._lastFragment = null;
    // Listen for changes
    window.addEventListener('hashchange', this.handleHashChange.bind(this), false);
    this.handleHashChange();
  }

  handleHashChange() {
    const fragment = decodeURIComponent(window.location.hash.substr(1));

    // Skip data that we've seen before
    if (this._lastFragment === fragment) {
      return;
    }

    this._lastFragment = fragment;

    // Split by separator and unescape separator
    this._states = fragment
      .split(this._options.separator)
      .map(unescapeChar.bind(null, this._options.separator));

    this._states.forEach((hashState, index) => {
      const entry = this._entries[index];

      // If there is an entry and hashState has changed, set it and call handler
      if (entry && !_.isEqual(entry.hashState, hashState)) {
        entry.hashState = hashState;

        if (entry._handler instanceof Function) {
          entry._handler(hashState);
        }
      }
    });
  }

  /**
   * Update location.hash after changes to states in entries.
   * Used by HashEntry instances, don't call directly.
   */
  update() {
    const states = this._entries.map(entry => entry.hashState);
    // Escape separator and join by separator
    const fragment = states
      .map(escapeChar.bind(null, this._options.separator))
      .join(this._options.separator);

    if (this._lastFragment === fragment) {
      return;
    }

    this._lastFragment = fragment;
    window.location.hash = `#${encodeFragment(fragment)}`;
  }

  /** Get root entry */
  root() {
    if (!this._entries[0]) {
      this._entries[0] = new HashEntry(0, this._states[0], this);
    }

    return this._entries[0];
  }
}

/**
 * Create a HashManager
 *
 * options:
 * {
 *    separator:          '/' // Separator character
 * }
 *
 * You can only create one HashManager per page. Use `hashManager.root()` to
 * get the root hashEntry.
 */
let _createdHashManager = false;
export const createHashManager = options => {
  assert(_createdHashManager === false, 'Only one HashManager can be created!');
  _createdHashManager = true;

  return new HashManager(options);
};

/**
 * Create a LocationHashMixin instance with given options.
 *
 * options:
 * {
 *   keys:    ['taskId'],     // Paths from this.state to persist to hashEntry
 *   type:    'string'        // 'json' or 'string'
 * }
 *
 * Components implementing this will the state keys from `options.keys`
 * persisted in the HashEntry assigned to their `hashEntry` property.
 * If a subcomponent of a component implements this mixin, the component should
 * pass `this.nextHashEntry()` as `hashEntry` property on the subcomponent.
 *
 * Note, only one subcomponent can persist it's state.
 */
export const createLocationHashMixin = opts => {
  const options = {type: 'string', ...opts};

  assert(Array.isArray(options.keys), 'keys must be given');
  assert(options.keys.length > 0, 'at least one key must be given');
  assert(options.type === 'string' || options.type === 'json',
    'type must be either "string" or "json"');

  options.keys = parsePaths(options.keys);

  return {
    /** Get state from with hashEntry */
    componentWillMount() {
      // Add new manager
      if (this.props.hashEntry) {
        // Create a hashEntry for key that needs to be stored
        this.__hashEntries = [this.props.hashEntry];

        let prevEntry = this.props.hashEntry;

        for (let i = 1; i < options.keys.length; i++) {
          prevEntry = this.__hashEntries[i] = prevEntry.next();
        }

        // Add handlers
        this.__hashEntries.forEach((hashEntry, index) => {
          hashEntry.add(this.handleStateHashChange.bind(this, index));
        });
      }
    },

    /** Get state if new hashEntry is given */
    componentWillReceiveProps(nextProps) {
      // Only add remove if the hashEntry actually changed
      if (this.props.hashEntry !== nextProps.hashEntry) {
        // Remove existing hashEntry
        if (this.props.hashEntry && this.__hashEntries.length > 0) {
          this.__hashEntries.forEach(hashEntry => hashEntry.remove());
          this.__hashEntries = [];
        }

        // Add new hashEntry
        if (nextProps.hashEntry) {
          // Create a hashEntry for key that needs to be stored
          this.__hashEntries = [this.props.hashEntry];

          let prevEntry = this.props.hashEntry;

          for (let i = 1; i < options.keys.length; i++) {
            prevEntry = this.__hashEntries[i] = prevEntry.next();
          }

          // Add handlers
          this.__hashEntries.forEach((hashEntry, index) => {
            hashEntry.add(this.handleStateHashChange.bind(this, index));
          });
        }
      }
    },

    /** Remove from hashEntry */
    componentWillUnmount() {
      // Remove hashEntry
      if (this.props.hashEntry && this.__hashEntries.length > 0) {
        this.__hashEntries.forEach(hashEntry => hashEntry.remove());
        this.__hashEntries = [];
      }
    },

    /** Provide hashEntry with new state */
    componentDidUpdate() {
      if (this.props.hashEntry && this.__hashEntries.length > 0) {
        assert(this.__hashEntries.length === options.keys.length);

        // Track if we should update
        let doUpdate = false;

        // For each key/hashEntry that we have
        options.keys.forEach((key, index) => {
          // Find hashState for key
          let hashState = valueAtPath(key, this.state);

          if (options.type === 'json') {
            hashState = rison.encode(hashState);
          } else if (hashState == null) {
            hashState = '';
          } else {
            // ensure that it's a string
            hashState = `${hashState}`;
          }

          // Find hashEntry
          const hashEntry = this.__hashEntries[index];

          if (hashEntry.hashState !== hashState) {
            hashEntry.hashState = hashState;
            doUpdate = true;
          }
        });

        // Update if necessary
        if (doUpdate) {
          this.props.hashEntry.manager.update();
        }
      }
    },

    /** Handle updates from hashEntry */
    handleStateHashChange(index, _hashState) {
      let hashState = _hashState;

      // decode json if necessary
      if (options.type === 'json') {
        // If empty string we'll load initial state
        if (hashState === '') {
          hashState = this.getInitialState()[options.keys[index]];
        } else {
          hashState = rison.decode(hashState);
        }
      }

      this.setState({
        [options.keys[index]]: hashState,
      });
    },

    /** Return next hashEntry if one is available */
    nextHashEntry() {
      if (this.props.hashEntry) {
        // Make sure next() follows the number we need to hold keys that we store
        let lastHashEntry = this.props.hashEntry;

        for (let i = 1; i < options.keys.length; i++) {
          lastHashEntry = lastHashEntry.next();
        }

        return lastHashEntry.next();
      }
    },
  };
};

/**
 * Watch for state changes.
 *
 * This component will dispatch the event `watch-reload` when:
 *  - handlers in the wrapped component need to be triggered
 *
 * Implementors can call `watchStateProps(props)` to send props to analyze.
 * This function is meant to be invoked after every props change.
 * example: this.props.watchStateProps(this.props)
 *
 *
 * options:
 * {
 *   onProps: {
 *     handler:     ['prop1.prop2', 'prop3']
 *   },
 *   onKeys: {
 *     handler:     ['k1.k2', 'k3']
 *   }
 * }
 *
 * In the example above, `this.handler()` of the wrapped component will be called if, `props.match.params.k1.k2` or
 * `props.match.params.k3` is modified. And similarly if `this.props.prop1.prop2` or
 * `this.props.prop3` is changed.
 *
 * Be careful with this component and watch out for infinite loops. Never modify
 * a state property that triggers a method in a handler.
 */
export const CreateWatchState = (Component, opts) => (
  class extends React.Component {
    constructor(props) {
      super(props);

      this.options = {
        onProps: {},
        onKeys: {},
        ...opts,
      };

      _.forIn(this.options.onProps, (paths, key) => {
        assert(Array.isArray(paths), `'${key}' must map to an array`);
        this.options.onProps[key] = parsePaths(paths);
      });

      _.forIn(this.options.onKeys, (paths, key) => {
        assert(Array.isArray(paths), `'${key}' must map to an array`);
        this.options.onKeys[key] = parsePaths(paths);
      });

      this.componentKeys = {};
      this.componentProps = {};

      this.watchState = this.watchState.bind(this);
    }

    /** Check if handlers needs to be triggered given keys and props */
    watchState(keys, props) {
      // Build a list of handlers to call
      const handlers = [];

      // Find handlers triggered by state changes
      _.forIn(this.options.onKeys, (paths, method) => {
        if (!_.includes(handlers, method) && hasChanged(paths, keys, this.componentKeys)) {
          handlers.push(method);
        }
      });

      // Find handlers triggered by property changes
      _.forIn(this.options.onProps, (paths, method) => {
        if (!_.includes(handlers, method) && hasChanged(paths, props, this.componentProps)) {
          handlers.push(method);
        }
      });

      // Dispatch event to invoke handlers
      const uniqueHandlers = _.uniq(handlers);

      if (uniqueHandlers.length) {
        document.dispatchEvent(new CustomEvent('watch-reload', {detail: uniqueHandlers}));
      }

      // Update previous props & keys
      this.componentKeys = {...keys};
      this.componentProps = {...props};
    }

    render() {
      return <Component {...this.props} watchState={this.watchState} />;
    }
  }
);

/**
 * Watch for state changes.
 *
 * options:
 * {
 *   onProps: {
 *     handler:     ['prop1.prop2', 'prop3']
 *   },
 *   onKeys: {
 *     handler:     ['k1.k2', 'k3']
 *   }
 * }
 *
 * In the example above, `this.handler()` will be called if, `state.k1.k2` or
 * `state.k3` is modified. And similarly if `this.props.prop1.prop2` or
 * `this.props.prop3` is changed.
 *
 * Be careful with this mixin and watch out for infinite loops. Never modify
 * a state property that triggers a method in a handler.
 */
export const createWatchStateMixin = opts => {
  const options = {
    onProps: {},
    onKeys: {},
    triggerAfterMount: true,
    ...opts,
  };

  _.forIn(options.onProps, (paths, key) => {
    assert(Array.isArray(paths), `'${key}' must map to an array`);
    options.onProps[key] = parsePaths(paths);
  });

  _.forIn(options.onKeys, (paths, key) => {
    assert(Array.isArray(paths), `'${key}' must map to an array`);
    options.onKeys[key] = parsePaths(paths);
  });

  return {
    /** Perform sanity check to ensure that handlers are available */
    componentWillMount() {
      _.forIn(options.onKeys, (paths, method) => {
        assert(this[method] instanceof Function, `Handler '${method}' is missing`);
      });

      _.forIn(options.inProps, (paths, method) => {
        assert(this[method] instanceof Function, `Handler '${method}' is missing`);
      });
    },

    /** Check if any keys that we're watching changed since launch */
    componentDidMount() {
      // Don't trigger on DidMount of options don't allow it
      if (!options.triggerAfterMount) {
        return;
      }

      // Construct default props
      let prevProps;

      if (this.getDefaultProps instanceof Function) {
        prevProps = this.getDefaultProps();
      }

      // Construct initial state
      let prevState;

      if (this.getInitialState instanceof Function) {
        prevState = this.getInitialState();
      }

      // Trigger handlers if watched things changed
      this.triggerWatchHandler(prevProps, prevState);
    },

    /** Handle state changes */
    componentDidUpdate(prevProps, prevState) {
      this.triggerWatchHandler(prevProps, prevState);
    },

    /** Check if handlers needs to be triggered */
    triggerWatchHandler(prevProps, prevState) {
      // Build a list of handlers to call
      const handlers = [];

      // Find handlers triggered by state changes
      _.forIn(options.onKeys, (paths, method) => {
        if (!_.includes(handlers, method) && hasChanged(paths, this.state, prevState)) {
          handlers.push(method);
        }
      });

      // Find handlers triggered by property changes
      _.forIn(options.onProps, (paths, method) => {
        if (!_.includes(handlers, method) && hasChanged(paths, this.props, prevProps)) {
          handlers.push(method);
        }
      });

      // Call handlers that needs to be invoked
      _.uniq(handlers).forEach(handler => this[handler]());
    },
  };
};
