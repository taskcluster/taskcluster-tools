import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';

export default class TaskRun extends Component {

  constructor(props) {
    super(props);
    this.generateRows = this.generateRows.bind(this);
  }

  getArtifacts() {
    const { artifacts } = this.props;
    if(!!artifacts.length) {
      return artifacts.map((artifact,index) => {
        return (
          <li key={index}><a>{artifact.name}</a></li>
        )
      });
    }

  }

  generateRows() {
    const { task, status } = this.props,
          runNumber = status.runs.length - 1;

    const elemsToRender = {
      reasonCreated: status.runs[runNumber].reasonCreated,
      reasonResolved: status.runs[runNumber].reasonResolved,
      state: status.runs[runNumber].state,
      scheduled: status.runs[runNumber].scheduled,
      started: status.runs[runNumber].started,
      resolved: status.runs[runNumber].resolved,
    }

    return Object.keys(elemsToRender).map(function(key) {
      return (
        <tr>
          <td><b>{ _.capitalize(key) }</b></td>
          <td>{elemsToRender[key]}</td>
        </tr>
      );
    });
  }

  render() {
    const { task, status } = this.props,
          runNumber = status.runs.length - 1,
          rowComponents = this.generateRows(),
          artifactsComponent = this.getArtifacts();

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
                <ul>{artifactsComponent}</ul>
              </td>
            </tr>

            </tbody>
        </table>

      </div>
    );
  }

}
