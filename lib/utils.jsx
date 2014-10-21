/** @jsx React.DOM */
var React         = require('react');
var _             = require('lodash');
var auth          = require('./auth');
var Promise       = require('promise');
var debug         = require('debug')('lib:utils');

// Export debug module for use in browser
window.DEBUG      = require('debug');


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

      // Create a new reload iteration and remember the reload iteration
      // to avoid overwriting state if a newer reload iteration have begun
      if (this.__reloadIteration === undefined) {
        this.__reloadIteration = 0;
      }
      this.__reloadIteration += 1;
      var currentReloadIteration = this.__reloadIteration;

      // Get a mapping from state properties to promises
      var statePromises = this.load(props) || {};

      // Construct and set initial state
      var state = {};
      _.forIn(statePromises, function(promise, key) {
        // Set loading state
        state[key + 'Loaded'] = false;
        state[key + 'Error']  = undefined;
        state[key]            = undefined;
      });
      this.setState(state);

      // Construct a setState method that'll ignore old state and bind to this
      var setState = function(state) {
        // Ignore state, if reload have been called again
        if (this.__reloadIteration === currentReloadIteration) {
          this.setState(state);
        }
      }.bind(this);

      // Update state as promises are resolved
      var promises = _.map(statePromises, function(promise, key) {
        return Promise.resolve(promise).then(function(result) {
          // Set result state
          var state = {};
          state[key + 'Loaded'] = true;
          state[key + 'Error']  = undefined;
          state[key]            = result;
          setState(state);
        }, function(err) {
          debug("Error loading '%s', err: %s, as JSON: %j", key, err, err, err.stack);
          // Set error state
          var state = {};
          state[key + 'Loaded'] = true;
          state[key + 'Error']  = err || new Error("Unknown Error");
          state[key]            = undefined;
          setState(state);
        });
      });

      // Return promise all promises are resolved
      return Promise.all(promises).then(function() {
        return undefined;
      });
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
