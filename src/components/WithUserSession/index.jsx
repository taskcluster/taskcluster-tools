import { PureComponent } from 'react';
import { func, object } from 'prop-types';

export default class WithUserSession extends PureComponent {
  static contextTypes = {
    authController: object.isRequired
  };

  static propTypes = {
    children: func.isRequired
  };

  handleUserSessionChanged = () => {
    this.forceUpdate();
  };

  componentDidMount() {
    const { authController } = this.context;

    authController.on('user-session-changed', this.handleUserSessionChanged);
  }

  componentWillUnmount() {
    this.context.authController.off(
      'user-session-changed',
      this.handleUserSessionChanged
    );
  }

  render() {
    // note: an update to the userSession will cause a forceUpdate
    const userSession = this.context.authController.getUserSession();

    return this.props.children(userSession);
  }
}
