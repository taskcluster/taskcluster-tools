/** @jsx React.DOM */
var React         = require('react');
var _             = require('lodash');
var auth          = require('./auth');
var Promise       = require('promise');
var debug         = require('debug')('lib:utils');
var assert        = require('assert');


window.taskcluster = require('taskcluster-client');
/** Logic for loading and maintaining state using taskcluster-client


implementors can provide:
  load()
  returns a map from {property: promise}
  When the promise is successful state will be set as follows:
  {
    propertyLoaded:   true,
    propertyError:    undefined,
    property:         result from promise
  }
  If the promise is resolved unsuccessfully state will be set as follows:
  {
    propertyLoaded:   true,
    propertyError:    Error Object,
    property:         undefined
  }
  While the promise is waiting to be resolved state will be set as follows:
  {
    propertyLoaded:   false,
    propertyError:    undefined,
    property:         undefined
  }
  When rendering !propertyLoaded) will be true if it either haven't started
  loading or is loading...


implementors can provide:
  bindings() and handleMessage(message)
  In this case, bindings() must return a list of bindings based on this.state,
  this mixin will invoke bindings() whenever state changes and do a deepEquals
  to the current listener bindings.
  If they differ, the listener will be reinitialized.
  Whenever a message arrives from the listener it will be given to handleMessage
  which must also be defined, then method can then update state as necessary.

  Note, bindings() shouldn't have any side-effects!
  This will also add the following state:
  {
    isListening:    true || false
  }


*/
var createTaskClusterMixin = function(options) {
  // Set default options
  options = _.defaults({}, options, {
    clients:        {},
    reloadOnProps:  false   // List of properties to reload on, or `true`
  });
  return {
    /** Setup object and start listening for events */
    componentDidMount: function() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());

      // Listen for changes to credentials
      window.addEventListener(
        'credentials-changed',
        this.handleCredentialsChanged,
        false
      );

      // Reload state (initial load)
      this.reload();
    },

    /** Check if the new properties causes us to reload */
    componentWillReceiveProps: function(nextProps) {
      // reload if we reload on any property change
      var shallReload = (options.reloadOnProps === true);

      // If reloadOnProps is an array, we'll check if any of the properties
      // defined in the list have changed
      if (!shallReload && options.reloadOnProps instanceof Array) {
        shallReload = _.some(options.reloadOnProps, function(property) {
          return this.props[property] !== nextProps[property];
        }, this);
      }

      // Reload state if we have to
      if (shallReload) {
        this.reload(nextProps);
      }
    },

    /** handle changes to credentials */
    handleCredentialsChanged: function(e) {
      // Update clients with new credentials
      this._createClients(e.detail);

      // Reload state now that we have new credentials
      this.reload();
    },

    /** Stop listening for events */
    componentWillUnmount: function() {
      // Remove credentials-changed event handler
      window.removeEventListener(
        'credentials-changed',
        this.handleCredentialsChanged,
        false
      );
    },

    /** Load state from a map from property to promise */
    loadState: function(promisedState) {
      assert(promisedState instanceof Object, "Expected an object");

      // map from promised state property to load iteration count, so that old
      // loads that are resolved after newer requests aren't overwriting newer
      // state information
      if (this.__promisedStateIterationMap === undefined) {
        this.__promisedStateIterationMap = {};
      }

      // Construct and set initial state and construct current
      // promisedStateIterationMap
      var promisedStateIterationMap = {};
      var state = {};
      _.forIn(promisedState, function(promise, key) {
        // Set loading state
        state[key + 'Loaded'] = false;
        state[key + 'Error']  = undefined;
        state[key]            = undefined;
        // Ensure that there is already an iteration
        if (this.__promisedStateIterationMap[key] === undefined) {
          this.__promisedStateIterationMap[key] = 0;
        }
        // Create a new iteration
        this.__promisedStateIterationMap[key] += 1;
        // Remember the current iteration
        promisedStateIterationMap[key] = this.__promisedStateIterationMap[key];
      }, this);
      this.setState(state);

      // Construct a method that'll set state loaded and ignore old state if
      // a new promise for the property has arrived since
      var setLoaded = function(key, result, err) {
        // Ignore state, if loadState have been called again with this property
        var currentIteration = this.__promisedStateIterationMap[key];
        if (promisedStateIterationMap[key] === currentIteration) {
          var state = {};
          state[key + 'Loaded'] = true;
          state[key + 'Error']  = err;
          state[key]            = result;
          this.setState(state);
        }
      }.bind(this);

      // Update state as promises are resolved
      var promises = _.map(promisedState, function(promise, key) {
        return Promise.resolve(promise).then(function(result) {
          // Set result state
          setLoaded(key, result, undefined);
        }, function(err) {
          debug("Error loading '%s', err: %s, as JSON: %j",
                key, err, err, err.stack);
          // Set error state
          setLoaded(key, undefined, err || new Error("Unknown Error"));
        });
      });

      // Return promise all promises are resolved
      return Promise.all(promises).then(function() {
        return undefined;
      });
    },

    /** Reload state given properties to reload with */
    reload: function(props) {
      // If there is no `load` function then we're done
      if (!(this.load instanceof Function)) {
        return Promise.resolve(undefined);
      }

      // If no properties are given we'll use current properties
      if (props === undefined) {
        props = this.props;
      }

      // Load state from promised state given by this.load()
      return this.loadState(this.load(props) || {});
    },

    /**
     * Render a spinner or error message if `property` isn't loaded
     * this assume that `property` is loaded through `load()`. Hence, state
     * should have properties:
     * {<property>Loaded, <property>Error, <property>}
     *
     * Returns undefined if the property is loaded.
     */
    renderWaitFor: function(property) {
      if (this.state[property + 'Loaded']) {
        if (this.state[property + 'Error']) {
          return this.renderError(this.state[property + 'Error']);
        }
      } else {
        return this.renderSpinner();
      }
      return undefined;
    },

    /** Render a spinner */
    renderSpinner: function() {
      return <b>Loading...</b>;
    },

    /**
     * Error object, assumed to have message and possible properties from
     * taskcluster-client
     */
    renderError: function(err) {
      return <b>Error: {err.message}</b>;
    },

    /** Initialize client objects requested in options */
    _createClients: function(credentials) {
      _.forIn(options.clients, function(Client, key) {
        this[key] = new Client({
          // TODO: Fix this when deploying
          baseUrl:            'http://localhost:60550/v1',
          credentials:        credentials
        });
      }, this);
    },
  };
};

// Export createTaskClusterMixin
exports.createTaskClusterMixin = createTaskClusterMixin;
