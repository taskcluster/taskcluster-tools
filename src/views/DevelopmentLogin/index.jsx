import { Component } from 'react';
import { Redirect } from 'react-router-dom';
import UserSession from '../../auth/UserSession';

export default class DevelopmentLogin extends Component {
  constructor(props) {
    super(props);

    const search = new URLSearchParams(window.location.search);

    this.state = {
      credentials: {
        clientId: search.get('clientId'),
        accessToken: search.get('accessToken')
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
    return <Redirect to="/" />;
  }
}
