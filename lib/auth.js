var debug         = require('debug')('tools:lib:credentials');

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
exports.loadCredentials = loadCredentials;


/** Emit an event indicating that credentials have changed */
var credentialsChanged = function(credentials) {
  window.dispatchEvent(new Event('credentials-changed', {
    details:    credentials
  }));
};


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
  credentialsChanged(credentials);
};

// Export saveCredentials
exports.saveCredentials = saveCredentials;


// Listen for storage events to the credentials property
window.addEventListener('storage', function(e) {
  if (e.storageArea === localStorage &&
      e.key === 'credentials') {
    credentialsChanged(loadCredentials());
  }
}, false);
