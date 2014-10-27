var debug         = require('debug')('tools:lib:credentials');
var url           = require('url');

/** Load credentials from localStorage */
var loadCredentials = function() {
  // We have no credentials
  if (!localStorage.credentials) {
    return undefined;
  }
  // Attempt to parse credentials if they are present
  try {
    return JSON.parse(localStorage.credentials);
  }
  catch(err) {
    debug("Failed to parse credentials, err: %s", err, err.stack);
    return undefined;
  }
};

// Export loadCredentials
exports.loadCredentials = loadCredentials;


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
    pathname:       '/login'
  });
  var authUrl = url.format({
    protocol:       'http',
    host:           'localhost:60550',    // TODO: Fix this when deploying
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