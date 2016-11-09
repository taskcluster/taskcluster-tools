import React, {Component} from 'react';
import {Alert} from 'react-bootstrap';

export default class DashboardBanner extends Component {
  render() {
    const {bsStyle, title, message} = this.props;

    return (
      <Alert bsStyle={bsStyle}>
        <h4>{title}</h4>
        <div>{message}</div>
      </Alert>
    );
  }
}
