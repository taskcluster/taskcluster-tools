import React from 'react';
import { func } from 'prop-types';
import { camelCase } from 'change-case';
import taskcluster from 'taskcluster-client';

export default class Clients extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.getClients(props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.credentials !== this.props.credentials) {
      this.setState(this.getClients(nextProps));
    }
  }

  getClients(props) {
    const { children, credentials, ...clients } = props;

    return Object
      .entries(clients)
      .reduce((clients, [key, value]) => ({
        ...clients,
        [camelCase(key)]: value === true ?
          new taskcluster[key]({ credentials }) :
          new taskcluster[key]({ credentials, ...value })
      }), {});
  }

  render() {
    return this.props.children(this.state);
  }
};

Clients.propTypes = {
  children: func.isRequired
};
