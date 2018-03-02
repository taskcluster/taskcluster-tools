import { PureComponent } from 'react';
import { func, object } from 'prop-types';
import { camelCase } from 'change-case';
import * as taskcluster from 'taskcluster-client-web';

export default class WithClients extends PureComponent {
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
    this.handleUserSessionChanged(authController.getUserSession());
  }

  componentWillUnmount() {
    this.context.authController.off(
      'user-session-changed',
      this.handleUserSessionChanged
    );
  }

  getClients() {
    const { children, ...clients } = this.props;
    const userSession = this.context.authController.getUserSession();
    const clientArgs = userSession ? userSession.clientArgs : null;

    return Object.entries(clients).reduce(
      (reduction, [key, value]) => ({
        ...reduction,
        [camelCase(key)]:
          value === true
            ? new taskcluster[key]({ ...clientArgs })
            : new taskcluster[key]({ ...clientArgs, ...value })
      }),
      {}
    );
  }

  render() {
    // note: an update to the userSession will cause a forceUpdate
    return this.props.children(this.getClients());
  }
}
