import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import { webListener } from '../lib/utils';

export default class DashboardBanner extends Component {

  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.stopListening = this.stopListening.bind(this);
  }

  close() {
    this.props.setBanner(false);
  }

  stopListening() {
    webListener.stopListening();
  }

  render() {
    if(this.props.showBanner) {
      return (
         <bs.Alert bsStyle="danger" onDismiss={this.close}>
          <h4>Oh snap!</h4>
          <p>The web listener has been put to sleep. Refresh the browser to see any updated changes.</p>
          <p>
            <bs.Button onClick={this.stopListening}>Stop listening</bs.Button> 
          </p>

        </bs.Alert>
      );  
    }
    return <span></span>;    
  }
}
