/** @jsx React.DOM */
var React         = require('react');
var _             = require('lodash');
var auth          = require('./auth');
var Promise       = require('promise');
var debug         = require('debug')('lib:utils');
var assert        = require('assert');
var awesome       = require('react-font-awesome');
var taskcluster   = require('taskcluster-client');
var debug         = require('debug')('lib:utils');
var rison         = require('rison');
var bs            = require('react-bootstrap');


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
var createTaskClusterMixin = function(options) {
  // Set default options
  options = _.defaults({}, options, {
    clients:        {},
    reloadOnProps:  [],  // List of properties to reload on
    reloadOnKeys:   []   // List of state keys to reload on
  });
  assert(options.reloadOnProps instanceof Array,
         "reloadOnProps must be an array");
  assert(options.reloadOnKeys instanceof Array,
         "reloadOnKeys must be an array");
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

    /** Check if the props or state changes causes us to reload */
    componentDidUpdate: function(prevProps, prevState) {
      var shallReload = false;

      // Check if any of the properties defined in reloadOnProps have changed
      if (!shallReload) {
        shallReload = _.some(options.reloadOnProps, function(property) {
          return !_.isEqual(this.props[property], prevProps[property]);
        }, this);
      }

      // Check if any of state keys defined in reloadOnKeys have changed
      if (!shallReload) {
        shallReload = _.some(options.reloadOnKeys, function(key) {
          return !_.isEqual(this.state[key], prevState[key]);
        }, this);
      }

      // Reload state if we have to
      if (shallReload) {
        this.reload();
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
    reload: function() {
      // If there is no `load` function then we're done
      if (!(this.load instanceof Function)) {
        return Promise.resolve(undefined);
      }

      // Get promised state
      var promisedState = this.load() || {};

      // If changes to any of these properties is in reloadOnKeys we'll create
      // an infinite loop, I hate those!
      var conflictKeys = _.keys(promisedState).filter(function(key) {
        return _.contains(options.reloadOnKeys, key) ||
               _.contains(options.reloadOnKeys, key + 'Error') ||
               _.contains(options.reloadOnKeys, key + 'Loaded');
      });
      if (conflictKeys.length > 0) {
        debug("Keys that shouldn't be in reloadOnKeys or not returned",
              " by load() are: %j", conflictKeys);
      }
      assert(conflictKeys.length === 0, "You can't reload on keys that are " +
             " returned by load(), this easily creates infinite loops");

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
      return (
        <div style={{textAlign: 'center', margin: 20}}>
          <awesome.Icon type="spinner" size="2x" spin/>
        </div>
      );
    },

    /**
     * Error object, assumed to have message and possible properties from
     * taskcluster-client
     */
    renderError: function(err) {
      var body = undefined;
      if (err.body) {
        body = (
          <pre>
            {JSON.stringify(err.body, null, 2)}
          </pre>
        );
      }
      var code = undefined;
      if (err.statusCode) {
        code = err.statusCode + ': ';
      }
      return (
        <bs.Alert bsStyle="danger">
          <strong>
            {code}&nbsp;
            {err.message || 'Unknown Error'}
          </strong>
          {body}
        </bs.Alert>
      );
    },

    /** Initialize client objects requested in options */
    _createClients: function(credentials) {
      _.forIn(options.clients, function(Client, key) {
        this[key] = new Client({
          credentials:        credentials
        });
      }, this);
    },
  };
};

// Export createTaskClusterMixin
exports.createTaskClusterMixin = createTaskClusterMixin;

/**
 * Logic for listening to Pulse exchanges using WebListener
 *
 * This mixin offers method:
 *  - `startListening(bindings)`
 *  - `stopListening()`
 *
 * You can call `startListening(bindings)` repeatedly to listen to additional
 * bindings.
 *
 * This mixin adds the state property `listening` to state as follows:
 *
 * {
 *    listening:    true || false || null // null when connecting
 * }
 */
var createWebListenerMixin = function(options) {
  // Set default options
  options = _.defaults({}, options, {
    bindings:     [] // initial bindings
  });
  return {
    /** Start listening if bindings are configured */
    componentDidMount: function() {
      this.__listener = null;

      if (options.bindings.length > 0) {
        this.startListening(options.bindings.length);
      }
    },

    /** Stop listening */
    componentWillUnmount: function() {
      this.stopListening();
    },

    /** Start listening */
    startListening: function(bindings) {
      // Get bindings if none are provided
      if (!bindings || bindings.length === 0) {
        return Promise.resolve(undefined);
      }

      // If not listening start listening
      if (!this.__listener) {
        this.__listener = new taskcluster.WebListener();
        this.__listener.on('message', this.handleMessage);
        this.__listener.on('error', function(err) {
          debug("Error while listening: %s, %j", err, err);
          if (!err) {
            err = new Error("Unknown error");
          }
          this.setState({listeningError: err});
          this.stopListening();
        }.bind(this));

        // Bind to bindings
        var bound = bindings.map(function(binding) {
          return this.__listener.bind(binding);
        }, this);

        this.setState({
          listening:        null,
          listeningError:   undefined
        });
        return Promise.all(bound.concat([
          this.__listener.resume()
        ])).then(function() {
          debug("Listening for messages...");
          this.setState({
            listening:        true,
            listeningError:   undefined
          });
        }.bind(this), function(err) {
          debug("Error while listening: %s, %j", err, err);
          if (!err) {
            err = new Error("Unknown error");
          }
          this.setState({listeningError: err});
          return this.stopListening();
        }.bind(this));
      }

      // Bind to all new bindings
      this.setState({
        listening:        null,
        listeningError:   undefined
      });
      return Promise.all(bindings.map(function(binding) {
        return this.__listener.bind(binding);
      }, this)).then(function() {
        this.setState({
          listening:        true,
          listeningError:   undefined
        });
      }.bind(this), function(err) {
        debug("Error while listening: %s, %j", err, err);
        if (!err) {
          err = new Error("Unknown error");
        }
        this.setState({listeningError: err});
        return this.stopListening();
      }.bind(this));
    },

    /** Stop listening, if already listening */
    stopListening: function() {
      this.setState({listening: false});
      if (this.__listener) {
        var closed = this.__listener.close();
        this.__listener = null;
        return closed;
      }
      return Promise.resolve(undefined);
    }
  };
};

// Export createWebListenerMixin
exports.createWebListenerMixin = createWebListenerMixin;


/** Escape a string for use in a regular expression */
var escapeForRegularExpression = function(string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};


/** Apply a hexa decimal */
var escapeChar = function(character, string) {
  assert(character.length === 1, "character must have length 1");
  var regExp = new RegExp(escapeForRegularExpression(character), 'g');
  return string.replace(regExp, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
};

// Export escapeChar
exports.escapeChar = escapeChar;

/** Unescape a specific character, reversing escapeChar */
var unescapeChar = function(character, string) {
  assert(character.length === 1, "character must have length 1");
  var needle = '%' + character.charCodeAt(0).toString(16);
  var regExp = new RegExp(escapeForRegularExpression(needle), 'g');
  return string.replace(regExp, character);
};

// Export unescapeChar
exports.unescapeChar = unescapeChar;

/** Encode string for use in window.location.hash */
var encodeFragment = function(string) {
  return string.replace(/[^a-zA-Z0-9!$&'()*+,;=:@\-._~?\/]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
};

// Export encodeFragment
exports.encodeFragment = encodeFragment;


/**
 * Create a LocationHashMixin instance with given options.
 *
 * options:
 * {
 *   keys:    ['taskId'],     // Keys from this.state to persist to hashEntry
 *   type:    'string'        // 'json' or 'string', string only works if
 *                            // there is only one key and it's a string.
 * }
 *
 * Components implementing this will the state keys from `options.keys`
 * persisted in the HashEntry assigned to their `hashEntry` property.
 * If a subcomponent of a component implements this mixin, the component should
 * pass `this.props.hashEntry.next()` as `hashEntry` property on the
 * subcomponent. But do check if `this.props.hashEntry` is defined.
 *
 * Note, only one subcomponent can persist it's state.
 */
var createLocationHashMixin =  function(options) {
  assert(options,                       "options is required");
  assert(options.keys instanceof Array, "keys must be given");
  assert(options.keys.length > 0,       "at least one key must be given");
  assert(options.type === 'string' || options.type === 'json',
         "type must be either 'string' or 'json'");
  assert(options.keys.length <= 1 || options.type === 'json',
         "when encoding multiple keys type must be 'json'");
  return {
    /** Get state from with hashEntry */
    componentWillMount: function() {
      // Add new manager
      if (this.props.hashEntry) {
        this.props.hashEntry.add(this.handleStateHashChange);
      }
    },

    /** Get state if new hashEntry is given */
    componentWillReceiveProps: function(nextProps) {
      // Remove existing manager
      if (this.props.hashEntry) {
        this.props.hashEntry.remove(this.handleStateHashChange);
      }
      // Add new manager
      if (nextProps.hashEntry) {
        nextProps.hashEntry.add(this.handleStateHashChange);
      }
    },

    /** Remove from hashEntry */
    componentWillUnmount: function() {
      if (this.props.hashEntry) {
        this.props.hashEntry.remove(this.handleStateHashChange);
      }
    },

    /** Provide hashEntry with new state */
    componentDidUpdate: function() {
      if (this.props.hashEntry) {
        var hashState = undefined;
        // Find state
        if (options.keys.length === 1) {
          hashState = this.state[options.keys[0]];
        } else {
          hashState = _.pick(this.state, options.keys);
        }
        if (options.type === 'json') {
          hashState = rison.encode(hashState);
        } else {
          hashState = hashState || '';
        }
        assert(typeof(hashState) === 'string',
               "encoded hashState must be a string, " +
               "if you're using type 'string' this your fault!");
        this.props.hashEntry.setHashState(hashState);
      }
    },

    /** Handle updates from hashEntry */
    handleStateHashChange: function(hashState) {
      if (options.type === 'json') {
        if (hashState === '') {
          if (options.keys.length === 1) {
            hashState = this.getInitialState()[options.keys[0]];
          } else {
            hashState = _.pick(this.getInitialState(), options.keys);
          }
        } else {
          hashState = rison.decode(hashState);
        }
      } else {
        assert(options.keys.length === 1);
        if (hashState === '') {
          hashState = this.getInitialState()[options.keys[0]];
        }
      }
      if (options.keys.length === 1) {
        var state = {};
        state[options.keys[0]] = hashState;
        this.setState(state);
      } else {
        this.setState(hashState);
      }
    }
  };
};

// Export createLocationHashMixin
exports.createLocationHashMixin = createLocationHashMixin;




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
var HashManager = function(options) {
  this._options       = _.defaults({}, options, {
    separator:          '/'
  });
  assert(options.separator.length === 1, "Separator must have length 1");
  this._entries       = [];
  this._states        = [];     // Initial state for new HashEntry instances
  this._lastFragment  = undefined;
  // Listen for changes
  window.addEventListener(
    'hashchange',
    this.handleHashChange.bind(this),
    false
  );
  this.handleHashChange();
};

/** Handle hashchange events */
HashManager.prototype.handleHashChange = function() {
  var fragment = decodeURIComponent(window.location.hash.substr(1));
  // Skip data that we've seen before
  if (this._lastFragment === fragment) {
    return;
  }
  this._lastFragment = fragment;

  // Split by separator and unescape separator
  this._states = fragment
    .split(this._options.separator)
    .map(unescapeChar.bind(null, this._options.separator));

  this._states.forEach(function(hashState, index) {
    var entry = this._entries[index];
    // If there is an entry and hashState has changed, set it and call handler
    if (entry && !_.isEqual(entry._hashState, hashState)) {
      entry._hashState = hashState;
      if (entry._handler instanceof Function) {
        entry._handler(hashState);
      }
    }
  }, this);
};

/**
 * Update location.hash after changes to states in entries.
 * Used by HashEntry instances, don't call directly.
 */
HashManager.prototype.update = function() {
  var states = this._entries.map(function(entry) {
    return entry._hashState;
  });

  // Escape separator and join by separator
  var fragment = states
    .map(escapeChar.bind(null, this._options.separator))
    .join(this._options.separator);

  if (this._lastFragment === fragment) {
    return;
  }
  this._lastFragment = fragment;
  window.location.hash = '#' + encodeFragment(fragment);
};

/** Get root entry */
HashManager.prototype.root = function() {
  if (!this._entries[0]) {
    this._entries[0] = new HashEntry(0, this._states[0], this);
  }
  return this._entries[0];
};

/** Create HashEntry */
var HashEntry = function(index, hashState, manager) {
  this._index       = index;
  this._hashState   = hashState;
  this._handler     = null;
  this.manager      = manager;
};

/** Add handler and give HashState if not undefined */
HashEntry.prototype.add = function(handler) {
  assert(this._handler === null, "Cannot overwrite HashEntry hander!");
  this._handler = handler;
  if (this._hashState !== undefined) {
    this._handler(this._hashState);
  }
};

/** Remove handler and reset HashState */
HashEntry.prototype.remove = function(handler) {
  this._handler = null;
  this.setHashState(undefined);
};

/** Set current HashState */
HashEntry.prototype.setHashState = function(hashState) {
  if (this._hashState !== hashState) {
    this._hashState = hashState;
    this.manager.update();
  }
};

/** Get next HashEntry for the next index */
HashEntry.prototype.next = function() {
  var index = this._index + 1;
  if (!this.manager._entries[index]) {
    var entry = new HashEntry(index, this.manager._states[index], this.manager);
    this._entries[index] = entry;
  }
  return this._entries[index];
};



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
var _createdHashManager = false;
var createHashManager = function(options) {
  assert(_createdHashManager === false, "Only one HashManager can be created!");
  _createdHashManager = true;
  return new HashManager(options);
};


// Export createHashManager
exports.createHashManager = createHashManager;