import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import _ from 'lodash';
import TerminalView from './terminalView';
import { queue } from '../lib/utils';
import Select from 'react-select';

export default class LogView extends Component {


  constructor(props) {
  	super(props);
  	var entry = _.find(this.props.logs, {name: 'public/logs/terminal.log'}) ||
                _.find(this.props.logs, {name: 'public/logs/live.log'}) ||
                this.props.logs[0];
    this.state = {
    	name:       (entry ? entry.name : undefined)   // URL to show
    }

    this.handleLogChanged = this.handleLogChanged.bind(this);
    this.refreshLog = this.refreshLog.bind(this);
  }

  createUrlForArtifact() {
    const { taskId, runId } = this.props;
    const { name } = this.state;
    if (this.state.name) {
      return queue.buildUrl(queue.getArtifact, taskId, runId, name);
    }
  }

  handleLogChanged() {

  }

	refreshLog() {

	}  



  render() {
  	const { runId, taskId } = this.props;
    console.log('logs : ', logs);

    const logUrl = this.createUrlForArtifact();

    let logs = this.props.logs.map(log => {
      return {value: log.name, label: log.name};
    });
    
    
    return (
   		<span>
        
        <label>Show Log</label>
	   
        <Select
          value={this.state.name}
          onChange={this.handleLogChanged}
          options={logs}
          clearable={false}/>
      
      <button type="button"
              className="btn btn-sm btn-default log-view-btn-refresh"
              onClick={this.refreshLog}>
        <i className="glyphicon glyphicon-refresh"></i>
      </button>
   
   
      <TerminalView url={logUrl} />
    </span>

    );
  }

}
