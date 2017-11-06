import React from 'react';
import { func } from 'prop-types';
import { camelCase } from 'change-case';
import * as taskcluster from 'taskcluster-client-web';

export default class Clients extends React.PureComponent {
  static propTypes = {
    children: func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = this.getClients(props);
  }

  componentWillReceiveProps(nextProps) {
    // we want to regnerate clients on every userSession change, not
    // just user sign-in/sign-out
    if (nextProps.userSession !== this.props.userSession) {
      this.setState(this.getClients(nextProps));
    }
  }

  getClients(props) {
    const { children, userSession, ...clients } = props;
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
    return this.props.children(this.state);
  }
}
