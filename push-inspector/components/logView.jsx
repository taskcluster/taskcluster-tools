import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import _ from 'lodash';
import TerminalView from './terminalView';

export default class LogView extends Component {


  render() {
  	const { runId, taskId, logs } = this.props;
    console.log('logs : ', logs);
    return (
      <div>
        LogView
        <TerminalView />
      </div>
    );
  }

}
