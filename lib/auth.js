var debug         = require('debug')('tools:lib:credentials');
var url           = require('url');

/** Minimum number of ms to expiration before we log out */
const MIN_EXPIRY = 5 * 60 * 1000;

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
  window.dispatchEvent(new window.CustomEvent('credentials-changed', {
    detail:         credentials
  }));
};

// Export saveCredentials
exports.saveCredentials = saveCredentials;

/** Load credentials from localStorage */
var credentialsExpiredTimeout = null;
var loadCredentials = function() {
  // We have no credentials
  if (!localStorage.credentials) {
    return undefined;
  }
  // Attempt to parse credentials if they are present
  try {
    var creds = JSON.parse(localStorage.credentials);
    if (creds.certifcate && creds.certifcate.expiry < Date.now() - MIN_EXPIRY) {
      saveCredentials(null); // clear credentials
      return undefined;
    } else if (creds.certifcate) {
      clearTimeout(credentialsExpiredTimeout);
      credentialsExpiredTimeout = setTimeout(
        () => saveCredentials(null),
        creds.certifcate.expiry - Date.now() - MIN_EXPIRY
      );
    } else {
      clearTimeout(credentialsExpiredTimeout);
      credentialsExpiredTimeout = null;
    }
    return creds;
  }
  catch(err) {
    debug("Failed to parse credentials, err: %s", err, err.stack);
    return undefined;
  }
};

// Export loadCredentials
exports.loadCredentials = loadCredentials;

/** Check if we have credentials */
var hasCredentials = function() {
  var credentials = loadCredentials();
  return credentials !== undefined && credentials !== null;
};

// Export hasCredentials
exports.hasCredentials = hasCredentials;


// Listen for storage events to the credentials property
window.addEventListener('storage', function(e) {
  if (e.storageArea === localStorage &&
      e.key === 'credentials') {
    // Find the new credentials from the event
    var credentials = e.newValue;
    if (credentials) {
      try {
        credentials = JSON.parse(credentials);
      }
      catch(err) {
        debug("Failed to parse credentials, err: %s", err, err.stack);
        credentials = undefined;
      }
    }

    // Notify interested parties that credentials have changed
    window.dispatchEvent(new window.CustomEvent('credentials-changed', {
      detail:         credentials
    }));
  }
}, false);

/** Build URL to login at auth.taskcluster.net */
var buildLoginURL = function() {
  var target = url.format({
    protocol:       window.location.protocol,
    host:           window.location.host,
    pathname:       '/login/'
  });
  var authUrl = url.format({
    protocol:       'https',
    host:           'login.taskcluster.net',
    query: {
      target:       target,
      description: [
        "TaskCluster Tools offers various way to create and inspect both tasks",
        "and task-graphs."
      ].join('\n')
    }
  });

  return authUrl;
};

// Export buildLoginURL
exports.buildLoginURL = buildLoginURL;