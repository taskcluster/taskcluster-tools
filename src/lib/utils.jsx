import React from 'react';
import _ from 'lodash';
import * as auth from './auth';
import createDebugger from 'debug';
import assert from 'assert';
import * as format from './format';
import taskcluster from 'taskcluster-client';
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
        name: null, // Name of wrapped component
        ...opts,
      };

      assert(Array.isArray(this.options.reloadOnProps), 'reloadOnProps must be an array');
      assert(Array.isArray(this.options.reloadOnKeys), 'reloadOnKeys must be an array');
      assert(typeof this.options.name === 'string', 'name must be a string');

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
      this.getWrappedInstance = this.getWrappedInstance.bind(this);
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
      // this.reload();
    }

    /** Reload if props/keys change */
    taskclusterState(keys, props) {
      if ((keys && hasChanged(this.options.reloadOnKeys, keys, this.componentKeys)) ||
        (props && hasChanged(this.options.reloadOnProps, props, this.componentProps))) {
        this.componentKeys = keys;
        this.componentProps = props;

        this.reload(this.options.name);
      }
    }

    /** handle changes to credentials */
    handleCredentialsChanged(e) {
      // Update clients with new credentials
      this._createClients(e.detail);
      this.setState({createdTaskIdError: null});

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
      const detail = {
        name: this.options.name,
        state: this.state
      };

      document.dispatchEvent(new CustomEvent('taskcluster-update', {detail}));
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

    /** Access the wrapped component */
    getWrappedInstance() {
      return this.wrappedInstance;
    }

    render() {
      return (
        <Component
          {...this.props}
          clients={this.clients}
          ref={instance => this.wrappedInstance = instance}
          getWrappedInstance={this.getWrappedInstance}
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
      this.getWrappedInstance = this.getWrappedInstance.bind(this);
    }

    componentDidMount() {
      this.__listener = null;
      this.__bindings = [];
      this.componentBindings = this.wrappedInstance.bindings;

      if (this.componentBindings instanceof Function) {
        this.startListening(this.componentBindings());
      }
    }

    /** Stop listening */
    componentWillUnmount() {
      this.stopListening();
    }

    /** Access the wrapped component */
    getWrappedInstance() {
      return this.wrappedInstance;
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
        ref={instance => this.wrappedInstance = instance}
        getWrappedInstance={this.getWrappedInstance}
        startListening={this.startListening}
        stopListening={this.stopListening}
        listenerState={this.listenerState} />;
    }
  }
);

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
      this.getWrappedInstance = this.getWrappedInstance.bind(this);
    }

    /** Access the wrapped component */
    getWrappedInstance() {
      return this.wrappedInstance;
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
      return <Component
        {...this.props}
        ref={instance => this.wrappedInstance = instance}
        getWrappedInstance={this.getWrappedInstance}
        watchState={this.watchState} />;
    }
  }
);
