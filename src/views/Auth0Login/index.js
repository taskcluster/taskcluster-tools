import React from 'react';
import { WebAuth } from 'auth0-js';
import Error from '../../components/Error';
import UserSession from '../../auth/UserSession';

export default class Auth0Login extends React.PureComponent {
  state = {};

  webAuth() {
    return new WebAuth({
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      audience: process.env.AUTH0_AUDIENCE,
      redirectUri: new URL('/login/auth0', window.location).href,
      responseType: 'token id_token',
      scope: 'full-user-credentials openid profile'
    });
  }

  componentDidMount() {
    const { history } = this.props;

    if (window.location.hash) {
      this.webAuth().parseHash(window.location.hash, (loginError, authResult) => {
        if (loginError) {
          return this.setState({ loginError });
        }

        const userSession = UserSession.fromOIDC('mozilla-auth0', authResult.accessToken, authResult.idTokenPayload);
        this.props.setUserSession(userSession);

        // return from whence we came..
        if (window.opener) {
          window.close();
        } else {
          history.push('/');
        }
      });
    }
  }

  render() {
    if (this.state.loginError) {
      return <Error error={this.state.loginError} />;
    }

    // if window.location.hash is set, we are probably parsing the hash, so do nothing..
    if (window.location.hash) {
      return <p>Logging in..</p>;
    }

    this.webAuth().authorize();
  }
}
