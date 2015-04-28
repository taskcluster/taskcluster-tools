var React         = require('react');
var _             = require('lodash');
var auth          = require('./auth');
var Promise       = require('promise');
var debug         = require('debug')('lib:utils');
var assert        = require('assert');
var format        = require('./format');
var taskcluster   = require('taskcluster-client');
var debug         = require('debug')('lib:utils');
var rison         = require('rison');
var bs            = require('react-bootstrap');


/**
 * Given a JSON object `obj` and a path: ['key1', 'key2'] return
 * `obj.key1.key2` or undefined if the value doesn't exist
 */
var valueAtPath = function(path, obj, index) {
  index = index || 0;
  if (path.length === index) {
    return obj;
  }
  if (typeof(obj) !== 'object') {
    return undefined;
  }
  return valueAtPath(path, obj[path[index]], index + 1);
};

/**
 * Given a list of strings on the form ['key1.key2', 'key3'] return a list of
 * parsed keys where non-arrays are split by '.'
 */
var parsePaths = function(paths) {
  return paths.map(function(path) {
    if (path instanceof Array) {
      return path;
    }
    return path.split('.');
  });
};

/**
 * Check if values at `paths` has changed between `obj1` and `obj2`.
 *
 * In this case `paths` is an array of paths on form:
 * `[['key1', 'key2'], ['key3']]` and `obj1` and `obj2` are objects, or really
 * anything they want to be.
 *
 * Note, the comparison will do a deep equals of the values found.
 */
var hasChanged = function(paths, obj1, obj2) {
  assert(paths instanceof Array, "paths must be an array");
  return paths.some(function(path) {
    return !_.isEqual(valueAtPath(path, obj1), valueAtPath(path, obj2));
  });
};


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
    clients:        {},   // Mapping from name to clientClass
    clientOpts:     {},   // Mapping from name to client options
    reloadOnProps:  [],   // List of properties to reload on
    reloadOnKeys:   [],   // List of state keys to reload on
    reloadOnLogin:  true  // Reload when credentials are changed
  });
  assert(options.reloadOnProps instanceof Array,
         "reloadOnProps must be an array");
  assert(options.reloadOnKeys instanceof Array,
         "reloadOnKeys must be an array");
  options.reloadOnProps = parsePaths(options.reloadOnProps);
  options.reloadOnKeys = parsePaths(options.reloadOnKeys);
  return {
    componentWillMount: function() {
      // Create clients with current credentials
      this._createClients(auth.loadCredentials());
    },


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
      // Reload state if we have to
      if (hasChanged(options.reloadOnProps, this.props, prevProps) ||
          hasChanged(options.reloadOnKeys, this.state, prevState)) {
        this.reload();
      }
    },

    /** handle changes to credentials */
    handleCredentialsChanged: function(e) {
      // Update clients with new credentials
      this._createClients(e.detail);

      if (options.reloadOnLogin) {
        // Reload state now that we have new credentials
        this.reload();
      }
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
      var firstKeys = options.reloadOnKeys.map(_.first.bind(_));
      var conflictKeys = _.keys(promisedState).filter(function(key) {
        return _.contains(firstKeys, key) ||
               _.contains(firstKeys, key + 'Error') ||
               _.contains(firstKeys, key + 'Loaded');
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
          <format.Icon name="spinner" size="2x" spin/>
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
        this[key] = new Client(_.defaults(options.clientOpts[key] || {}, {
          credentials:        credentials
        }));
      }, this);
    },
  };
};

// Export createTaskClusterMixin
exports.createTaskClusterMixin = createTaskClusterMixin;

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
 */
var createWebListenerMixin = function(options) {
  // Set default options
  options = _.defaults({}, options || {}, {
    reloadOnProps:        [],   // List of properties to reload on
    reloadOnKeys:         []    // List of state keys to reload on
  });
  assert(options.reloadOnProps instanceof Array,
         "reloadOnProps must be an array");
  assert(options.reloadOnKeys instanceof Array,
         "reloadOnKeys must be an array");
  options.reloadOnProps = parsePaths(options.reloadOnProps);
  options.reloadOnKeys  = parsePaths(options.reloadOnKeys);
  return {
    /** Perform some sanity checks */
    componentWillMount: function() {
      assert(this.handleMessage instanceof Function,
             "components with this mixin must implement 'handleMessage'");
    },

    /** Start listening if bindings are configured */
    componentDidMount: function() {
      this.__listener = null;
      this.__bindings = [];

      if (this.bindings instanceof Function) {
        this.startListening(this.bindings());
      }
    },

    /** Stop listening */
    componentWillUnmount: function() {
      this.stopListening();
    },

    /** Reload listener if bindings changed */
    componentDidUpdate: function(prevProps, prevState) {
      // No need to check state if this.bindings() isn't implemented
      if (!(this.bindings instanceof Function)) {
        return;
      }

      // Decide if we should reload listener
      if(!hasChanged(options.reloadOnProps, this.props, prevProps) &&
         !hasChanged(options.reloadOnKeys, this.state, prevState)) {
        return;
      }

      // Get new bindings
      var bindings = this.bindings();

      // Find bindings removed
      var bindingsRemoved = this.__bindings.filter(function(currentBinding) {
        return !bindings.some(function(binding) {
          return currentBinding.exchange === binding.exchange &&
                 currentBinding.routingKeyPattern === binding.routingKeyPattern;
        });
      });

      // Find bindings added
      var bindingsAdded = bindings.filter(function(binding) {
        return !this.__bindings.some(function(currentBinding) {
          return currentBinding.exchange === binding.exchange &&
                 currentBinding.routingKeyPattern === binding.routingKeyPattern;
        });
      }, this);

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
    startListening: function(bindings) {
      // Get bindings if none are provided
      if (!bindings || bindings.length === 0) {
        return Promise.resolve(undefined);
      }

      // If not listening start listening
      if (!this.__listener) {
        assert(this.__bindings.length === 0, "Hmm... check stopListening");
        // Create listener
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
          this.__bindings.push(binding);
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
        this.__bindings.push(binding);
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
        this.__bindings = [];
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
  this._options       = _.defaults({}, options || {}, {
    separator:          '/'
  });
  assert(this._options.separator.length === 1, "Separator must have length 1");
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
    if (entry && !_.isEqual(entry.hashState, hashState)) {
      entry.hashState = hashState;
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
    return entry.hashState;
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
  this.hashState    = hashState;
  this._handler     = null;
  this.manager      = manager;
};

/** Add handler and give HashState if not undefined */
HashEntry.prototype.add = function(handler) {
  assert(this._handler === null, "Cannot overwrite HashEntry hander!");
  this._handler = handler;
  if (this.hashState !== undefined) {
    this._handler(this.hashState);
  }
};

/** Remove handler and reset HashState */
HashEntry.prototype.remove = function() {
  this._handler = null;
  if (this.hashState !== '') {
    this.hashState = '';
    this.manager.update();
  }
};

/** Get next HashEntry for the next index */
HashEntry.prototype.next = function() {
  var index = this._index + 1;
  if (!this.manager._entries[index]) {
    var entry = new HashEntry(index, this.manager._states[index], this.manager);
    this.manager._entries[index] = entry;
  }
  return this.manager._entries[index];
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
var createLocationHashMixin =  function(options) {
  options = _.defaults({}, options || {}, {
    type:                 'string'
  });
  assert(options.keys instanceof Array, "keys must be given");
  assert(options.keys.length > 0,       "at least one key must be given");
  assert(options.type === 'string' || options.type === 'json',
         "type must be either 'string' or 'json'");
  options.keys = parsePaths(options.keys);
  return {
    /** Get state from with hashEntry */
    componentWillMount: function() {
      // Add new manager
      if (this.props.hashEntry) {
        // Create a hashEntry for key that needs to be stored
        this.__hashEntries = [this.props.hashEntry];
        var prevEntry = this.props.hashEntry;
        for(var i = 1; i < options.keys.length; i++) {
          prevEntry = this.__hashEntries[i] = prevEntry.next();
        }
        // Add handlers
        this.__hashEntries.forEach(function(hashEntry, index) {
          hashEntry.add(this.handleStateHashChange.bind(this, index));
        }, this);
      }
    },

    /** Get state if new hashEntry is given */
    componentWillReceiveProps: function(nextProps) {
      // Only add remove if the hashEntry actually changed
      if (this.props.hashEntry !== nextProps.hashEntry) {
        // Remove existing hashEntry
        if (this.props.hashEntry && this.__hashEntries.length > 0) {
          this.__hashEntries.forEach(function(hashEntry) {
            hashEntry.remove();
          });
          this.__hashEntries = [];
        }
        // Add new hashEntry
        if (nextProps.hashEntry) {
          // Create a hashEntry for key that needs to be stored
          this.__hashEntries = [this.props.hashEntry];
          var prevEntry = this.props.hashEntry;
          for(var i = 1; i < options.keys.length; i++) {
            prevEntry = this.__hashEntries[i] = prevEntry.next();
          }
          // Add handlers
          this.__hashEntries.forEach(function(hashEntry, index) {
            hashEntry.add(this.handleStateHashChange.bind(this, index));
          }, this);
        }
      }
    },

    /** Remove from hashEntry */
    componentWillUnmount: function() {
      // Remove hashEntry
      if (this.props.hashEntry && this.__hashEntries.length > 0) {
        this.__hashEntries.forEach(function(hashEntry) {
          hashEntry.remove();
        });
        this.__hashEntries = [];
      }
    },

    /** Provide hashEntry with new state */
    componentDidUpdate: function() {
      if (this.props.hashEntry && this.__hashEntries.length > 0) {
        assert(this.__hashEntries.length === options.keys.length);

        // Track if we should update
        var doUpdate = false;

        // For each key/hashEntry that we have
        options.keys.forEach(function(key, index) {
          // Find hashState for key
          var hashState = valueAtPath(key, this.state);
          if (options.type === 'json') {
            hashState = rison.encode(hashState);
          } else {
            if (hashState === undefined || hashState === null) {
              hashState = '';
            }
            hashState = '' + hashState; // ensure that it's a string
          }
          // Find hashEntry
          var hashEntry = this.__hashEntries[index];
          if (hashEntry.hashState !== hashState) {
            hashEntry.hashState = hashState;
            doUpdate = true;
          }
        }, this);

        // Update if necessary
        if (doUpdate) {
          this.props.hashEntry.manager.update();
        }
      }
    },

    /** Handle updates from hashEntry */
    handleStateHashChange: function(index, hashState) {
      // decode json if necessary
      if (options.type === 'json') {
        // If empty string we'll load initial state
        if (hashState === '') {
          hashState = this.getInitialState()[options.keys[index]];
        } else {
          hashState = rison.decode(hashState);
        }
      }

      // Update state
      var state = {};
      state[options.keys[index]] = hashState;
      this.setState(state);
    },

    /** Return next hashEntry if one is available */
    nextHashEntry: function() {
      if (this.props.hashEntry) {
        // Make sure next() follows the number we need to hold keys that we store
        var lastHashEntry = this.props.hashEntry;
        for(var i = 1; i < options.keys.length; i++) {
          lastHashEntry = lastHashEntry.next();
        }
        return lastHashEntry.next();
      }
      return undefined;
    }
  };
};

// Export createLocationHashMixin
exports.createLocationHashMixin = createLocationHashMixin;


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
var createWatchStateMixin = function(options) {
  options = _.defaults({}, options || {}, {
    onProps:              {},
    onKeys:               {},
    triggerAfterMount:    true
  });
  _.forIn(options.onProps, function(paths, key) {
    assert(paths instanceof Array, "'" + key + "' must map to an array");
    options.onProps[key] = parsePaths(paths);
  });
  _.forIn(options.onKeys, function(paths, key) {
    assert(paths instanceof Array, "'" + key + "' must map to an array");
    options.onKeys[key] = parsePaths(paths);
  });
  return {
    /** Perform sanity check to ensure that handlers are available */
    componentWillMount: function() {
      _.forIn(options.onKeys, function(paths, method) {
        assert(this[method] instanceof Function,
               "Handler '" + method + "' is missing");
      }, this);
      _.forIn(options.inProps, function(paths, method) {
        assert(this[method] instanceof Function,
               "Handler '" + method + "' is missing");
      }, this);
    },

    /** Check if any keys that we're watching changed since launch */
    componentDidMount: function() {
      // Don't trigger on DidMount of options don't allow it
      if (!options.triggerAfterMount) {
        return;
      }
      // Construct default props
      var prevProps = undefined;
      if (this.getDefaultProps instanceof Function) {
        prevProps = this.getDefaultProps();
      }
      // Construct initial state
      var prevState = undefined;
      if (this.getInitialState instanceof Function) {
        prevState = this.getInitialState();
      }
      // Trigger handlers if watched things changed
      this.triggerWatchHandler(prevProps, prevState);
    },

    /** Handle state changes */
    componentDidUpdate: function(prevProps, prevState) {
      this.triggerWatchHandler(prevProps, prevState)
    },

    /** Check if handlers needs to be triggered */
    triggerWatchHandler: function(prevProps, prevState) {
      // Build a list of handlers to call
      var handlers = [];

      // Find handlers triggered by state changes
      _.forIn(options.onKeys, function(paths, method) {
        if (!_.contains(handlers, method) &&
            hasChanged(paths, this.state, prevState)) {
          handlers.push(method);
        }
      }, this);

      // Find handlers triggered by property changes
      _.forIn(options.onProps, function(paths, method) {
        if (!_.contains(handlers, method) &&
            hasChanged(paths, this.props, prevProps)) {
          handlers.push(method);
        }
      }, this);

      // Call handlers that needs to be invoked
      _.uniq(handlers).forEach(function(handler) {
        this[handler]();
      }, this);
    }
  };
};


// Export createWatchStateMixin
exports.createWatchStateMixin = createWatchStateMixin;
