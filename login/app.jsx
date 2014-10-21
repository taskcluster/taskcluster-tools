/** @jsx React.DOM */
var layout      = require('../lib/layout');
var React       = require('react');
var bs          = require('react-bootstrap');
var $           = require('jquery');
var querystring = require('querystring');
var login       = require('./login');
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
    // Inform the window that wanted to login that credentials have changed
    window.opener.postMessage({
      method:       'credentials-updated'
    }, location.origin);

    // Close window
    window.close();
  }
}


// Render component
$(function() {
  layout.renderNavigation({
    activePage:   '/login'      // Matching entry in menu.js
  });
  var credentials = auth.loadCredentials() || {};
  React.renderComponent(
    <login.CredentialsManager clientId={credentials.clientId}
                              accessToken={credentials.accessToken}
                              certificate={credentials.certificate}/>,
    $('#container')[0]
  );
});
