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
    if (nextProps.credentials !== this.props.credentials) {
      this.setState(this.getClients(nextProps));
    }
  }

  getClients(props) {
    const { children, credentials, ...clients } = props;

    return Object
      .entries(clients)
      .reduce((reduction, [key, value]) => ({
        ...reduction,
        [camelCase(key)]: value === true ?
          new taskcluster[key]({ credentials }) :
          new taskcluster[key]({ credentials, ...value })
      }), {});
  }

  render() {
    return this.props.children(this.state);
  }
}
