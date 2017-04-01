import React from 'react';
import querystring from 'querystring';
import * as auth from '../lib/auth';

const Login = (props) => {
  // Load credentials for querystring
  const credentials = querystring.parse(location.search.substr(1));

  // Update credentials if new ones were provided by querystring
  if (credentials.clientId && credentials.accessToken) {
    // Store credentials
    auth.saveCredentials(credentials);

    // If this window was opened by another window
    if (window.opener) {
      // Close window
      window.close();
    } else {
      props.history.push('/');
    }
  } else {
    // Redirect to the login page
    window.location = auth.buildLoginURL();
  }

  return null;
};

export default Login;
