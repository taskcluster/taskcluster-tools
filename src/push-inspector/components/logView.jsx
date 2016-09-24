import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import TerminalView from './terminalView';
import { queue } from '../lib/utils';
import Select from 'react-select';

export default class LogView extends Component {
  constructor(props) {
    super(props);

    const log = this.props.logs.find(({ name }) => name === 'public/logs/terminal.log' ||
      name === 'public/logs/live.log');
    const entry = log || this.props.logs[0];

    this.state = {
      name: entry ? entry.name : ''
    };

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

  /**
  * Handle log change
  */
  handleLogChanged(log) {
    if (this.state.name !== log.value) {
      this.setState({ name: log.value });
      this.refreshLog();
    }
  }

  /**
  * Refresh terminal
  */
  refreshLog() {
    this.refs.termView.refresh();
  }

  render() {
    const { runId, taskId } = this.props;
    const logUrl = this.createUrlForArtifact();
    const logs = this.props.logs.map(({ name }) => ({ value: name, label: name }));

    return (
      <span>
        <label>Show Log</label>
        <div className="select-wrapper">
          <Select
            value={this.state.name}
            onChange={this.handleLogChanged}
            options={logs}
            clearable={false} />

          <Button
            type="button"
            className="btn btn-sm btn-default"
            onClick={this.refreshLog}>
            <i className="glyphicon glyphicon-refresh" />
          </Button>
        </div>
        <TerminalView ref="termView" url={logUrl} />
      </span>
    );
  }
}
