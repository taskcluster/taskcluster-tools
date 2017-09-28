import React from 'react';
import { Redirect } from 'react-router-dom';
import UserSession from '../../auth/UserSession';

export default class Login extends React.Component {
  constructor(props) {
    super(props);

    const search = new URLSearchParams(window.location.search);

    this.state = {
      credentials: {
        clientId: search.get('clientId'),
        accessToken: search.get('accessToken'),
        certificate: search.get('certificate')
      }
    };
  }

  componentDidMount() {
    const { setUserSession, history } = this.props;
    const { credentials } = this.state;

    if (credentials.clientId && credentials.accessToken) {
      const userSession = UserSession.fromCredentials(credentials);

      setUserSession(userSession);

      if (window.opener) {
        window.close();
      } else {
        history.push('/');
      }
    }
  }

  render() {
    const { credentials } = this.state;

    if (credentials.clientId && credentials.accessToken) {
      return null;
    }

    return <Redirect to={this.props.loginUrl} />;
  }
}
