var debug         = require('debug')('tools:lib:credentials');
var EventEmitter  = require('events').EventEmitter;

// Create event emitter for global credentials events
var auth = new EventEmitter();

// Export auth a module
module.exports = auth;

/** Load credentials from localStorage */
var loadCredentials = function() {
  // We have no credentials
  if (localStorage.credentials === undefined) {
    return undefined;
  }
  // Attempt to parse credentials if they are present
  try {
    return JSON.parse(localStorage.credentials);
  }
  catch(err) {
    debug("Failed to parse credentials, err: %s", err);
    return undefined;
  }
};

// Export loadCredentials
auth.loadCredentials = loadCredentials;


/** Save credentials from localStorage (removed them if null is given) */
var saveCredentials = function(credentials) {
  if (!credentials) {
    // delete credentials
    delete localStorage.credentials;
  } else {
    // Store credentials as JSON
    localStorage.credentials = JSON.stringify(credentials);
  }

  // Notify interested parties that credentials have changed
  auth.emit('credentials-changed', credentials);
};

// Export saveCredentials
auth.saveCredentials = saveCredentials;


// Listen for storage events to the credentials property
window.addEventListener('storage', function(e) {
  if (e.storageArea === localStorage &&
      e.key === 'credentials') {
    auth.emit('credentials-changed', loadCredentials());
  }
}, false);
