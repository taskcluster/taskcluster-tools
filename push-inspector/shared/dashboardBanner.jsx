import React, { Component } from 'react';
import * as bs from 'react-bootstrap';

export default class DashboardBanner extends Component {
  constructor(props) {
    super(props);
  }

  render() { 
    const { bsStyle, dashboardMessage, action, actionText, title, message } = this.props;

    return (
      <bs.Alert bsStyle={bsStyle} >
        <h4>{title}</h4>
        <p>{message}</p>
      </bs.Alert>
    );   
  }
};
