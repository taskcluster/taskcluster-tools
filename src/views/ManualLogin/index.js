import React from 'react';
import UserSession from '../../auth/UserSession';
import ManualModal from '../../components/ManualModal';

export default class Login extends React.PureComponent {
  handleSubmit = credentials => {
    const userSession = UserSession.fromCredentials(credentials);
    this.props.setUserSession(userSession);
    this.close();
  };

  close() {
    if (window.opener) {
      window.close();
    } else {
      this.props.history.push('/');
    }
  }

  render() {
    return (
      <ManualModal handleSubmit={this.handleSubmit} onClose={this.close} />
    );
  }
}
