var $           = require('jquery');
var querystring = require('querystring');
var auth        = require('../lib/auth');

// Load credentials for querystring
var credentials = querystring.parse(location.search.substr(1));

// Update credentials if new ones were provided by querystring
if (credentials.clientId &&
    credentials.accessToken &&
    credentials.certificate) {
  // Parse certificate
  if (typeof(credentials.certificate) === 'string') {
    credentials.certificate = JSON.parse(credentials.certificate);
  }

  // Store credentials
  auth.saveCredentials(credentials);

  // If this window was opened by another window
  if (window.opener) {
    // Close window
    window.close();
  } else {
    window.location = '/';
  }
} else {
  // Redirect to the login page
  window.location = auth.buildLoginURL();
}

