import React from 'react';
import { Redirect } from 'react-router-dom';

export default class Login extends React.PureComponent {
  constructor(props) {
    super(props);

    const search = new URLSearchParams(location.search);

    this.state = {
      credentials: {
        clientId: search.get('clientId'),
        accessToken: search.get('accessToken'),
        certificate: search.get('certificate')
      }
    };
  }

  componentDidMount() {
    const { saveCredentials, history } = this.props;
    const { credentials } = this.state;

    if (credentials.clientId && credentials.accessToken) {
      saveCredentials(credentials);

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
