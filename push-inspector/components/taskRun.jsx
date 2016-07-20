import React, { Component } from 'react';
import _ from 'lodash';
import LogView from './logView';
import ArtifactList from './artifactList';

export default class TaskRun extends Component {
  constructor(props) {
    super(props);
    
    this.generateRows = this.generateRows.bind(this);
  }

  /**
  * Generate rows
  */
  generateRows() {
    const { task, status } = this.props;
    const runNumber = status.runs.length - 1;
    const run = status.runs[runNumber];

    const elems = {
      reasonCreated: run.reasonCreated,
      reasonResolved: run.reasonResolved,
      state: run.state,
      scheduled: run.scheduled,
      started: run.started,
      resolved: run.resolved,
    };

    return Object
      .keys(elems)
      .map((key, index) => {
        return (
          <tr key={index}>
            <td><strong>{ _.capitalize(key) }</strong></td>
            <td>{elems[key]}</td>
          </tr>
        );      
    });
  }

  /**
  * Render log view
  */
  renderLogView(taskId, runId, artifacts) { 
    const logs = artifacts.filter(({ name }) => /^public\/logs\//.test(name));

    if (logs.length === 0) {
      return;
    }

    return (
      <LogView logs={logs} taskId={taskId} runId={runId} />
    );
  }

  render() {
    const { task, status, artifacts } = this.props;
    const taskId = status.taskId;
    const runNumber = status.runs.length - 1;          

    // Check if we have the run
    if (runNumber < 0) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong>&nbsp;
          The task does not seem to have the requested run...
        </div>
      );
    }

    const rowComponents = this.generateRows();
    const runId = status.runs[runNumber].runId;          
    const logView = this.renderLogView(taskId, runId, artifacts);

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
                <ArtifactList ref="artifactList" artifacts={artifacts} taskId={taskId} runId={runId} />
              </td>
            </tr>            
            </tbody>
        </table>
        {logView}
      </div>
    );
  }
}
