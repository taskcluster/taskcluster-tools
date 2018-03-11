import { PureComponent } from 'react';
import UserSession from '../../auth/UserSession';
import ManualModal from '../../components/ManualModal';

export default class Login extends PureComponent {
  handleSubmit = credentials => {
    const userSession = UserSession.fromCredentials(credentials);

    this.props.setUserSession(userSession);
    this.handleClose();
  };

  handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      this.props.history.push('/');
    }
  };

  render() {
    return (
      <ManualModal onSubmit={this.handleSubmit} onClose={this.handleClose} />
    );
  }
}
