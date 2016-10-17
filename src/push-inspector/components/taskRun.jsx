import React, { Component } from 'react';
import _ from 'lodash';
import LogView from '../../lib/ui/logview';
import ArtifactList from './artifactList';

export default class TaskRun extends Component {
  constructor(props) {
    super(props);

    this.generateRows = this.generateRows.bind(this);
  }

  generateRows() {
    const { status } = this.props;
    const runNumber = status.runs.length - 1;
    const run = status.runs[runNumber];

    const elements = _.pick(run,
      ['reasonCreated', 'reasonResolved', 'state', 'scheduled', 'started', 'resolved']);

    return Object
      .keys(elements)
      .map((key, index) => (
        <tr key={index}>
          <td><strong>{_.capitalize(key)}</strong></td>
          <td>{elements[key]}</td>
        </tr>
      ));
  }

  renderLogView(taskId, runId, artifacts) {
    const logs = artifacts.filter(({ name }) => /^public\/logs\//.test(name));

    if (!logs.length) {
      return;
    }

    return (
      <LogView logs={logs} taskId={taskId} runId={runId} />
    );
  }

  render() {
    const { status, artifacts } = this.props;
    const taskId = status.taskId;
    const runNumber = status.runs.length - 1;

    // Check if we have the run
    if (runNumber < 0) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong>&nbsp;
          The task does not seem to have the requested run.
        </div>
      );
    }

    const rowComponents = this.generateRows();
    const runId = status.runs[runNumber].runId;

    return (
      <div>
        <table className="run-table">
          <tbody>
            {rowComponents}
            <tr>
              <td>
                <strong>Artifacts</strong>
              </td>
              <td>
                <ArtifactList
                  ref="artifactList"
                  artifacts={artifacts}
                  taskId={taskId}
                  runId={runId} />
              </td>
            </tr>
            </tbody>
        </table>
        {this.renderLogView(taskId, runId, artifacts)}
      </div>
    );
  }
}
