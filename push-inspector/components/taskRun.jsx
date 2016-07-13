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

    const elemsToRender = {
      reasonCreated: status.runs[runNumber].reasonCreated,
      reasonResolved: status.runs[runNumber].reasonResolved,
      state: status.runs[runNumber].state,
      scheduled: status.runs[runNumber].scheduled,
      started: status.runs[runNumber].started,
      resolved: status.runs[runNumber].resolved,
    };

    return Object.keys(elemsToRender).map(function(key, index) {
      return (
        <tr key={index}>
          <td><b>{ _.capitalize(key) }</b></td>
          <td>{elemsToRender[key]}</td>
        </tr>
      );
    });
  }

  /**
  * Render log view
  */
  renderLogView(taskId, runId, artifacts) {
    
    const logs = artifacts.filter(function(artifact) {
      return /^public\/logs\//.test(artifact.name);
    });

    if (logs.length === 0) {
      return undefined;
    }

    return (
      <LogView 
        logs={logs}
        taskId={taskId}
        runId={runId} />
    )
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
                <b>Artifacts</b>
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
