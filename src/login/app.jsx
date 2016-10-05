import querystring from 'querystring';
import * as auth from '../lib/auth';

// Load credentials for querystring
const credentials = querystring.parse(location.search.substr(1));

console.log('credentials', credentials);

// Update credentials if new ones were provided by querystring
if (credentials.clientId && credentials.accessToken) {
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
