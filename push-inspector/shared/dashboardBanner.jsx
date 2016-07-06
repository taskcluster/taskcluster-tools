import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import { webListener } from '../lib/utils';

export default class DashboardBanner extends Component {

  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }

  /**
  * Hide dashboard
  */
  close() {
    this.props.setDashboardBanner(false);
  }

  render() {
    
    const { bsStyle, dashboardMessage, action, actionText, dashboardHeaderMessage } = this.props;

    return (
       <bs.Alert bsStyle={bsStyle} onDismiss={this.close}>
        <h4>{dashboardHeaderMessage}</h4>
        <p>{dashboardMessage}</p>
        <p>
          <bs.Button onClick={action}>{actionText}</bs.Button> 
        </p>
      </bs.Alert>
    );   
  }
}
