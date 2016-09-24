import React, { Component } from 'react';
import { ButtonToolbar } from 'react-bootstrap';
import PurgeCacheButton from '../buttons/purgeCacheButton';
import RetriggerButton from '../buttons/retriggerButton';
import ScheduleTaskButton from '../buttons/scheduleTaskButton';
import CancelTaskButton from '../buttons/cancelTaskButton';
import EditAndCreateButton from '../buttons/editAndCreateButton';
import OneClickLoanerButton from '../buttons/oneClickLoanerButton';
import { beautified } from '../lib/utils';

export default class TaskDetail extends Component {
  /**
  * Render dependencies list
  */
  getDependenciesList(task) {
    const { dependencies } = task;

    if (!dependencies.length) {
      return <span>-</span>;
    }

    return (
      <div>
        <ul className="dependencies-ul">
          {
            dependencies.map((dependency, index) => (
              <li key={index}>
                <a href={`https://queue.taskcluster.net/v1/task/${dependency}`} target="_blank">
                  {dependency} <i className="fa fa-external-link" />
                </a>
              </li>
            ))
          }
        </ul>
      </div>
    );
  }

  render() {
    if (!this.props.task || !this.props.status) {
      return <div>Loading...</div>;
    }

    const { task, status } = this.props;
    const dependenciesList = this.getDependenciesList(task);

    return (
      <table className="detail-table">
        <tbody>
          <tr>
            <td><strong>Name</strong></td>
            <td>{task.metadata.name}</td>
          </tr>
          <tr>
            <td><strong>Description</strong></td>
            <td>{task.metadata.description}</td>
          </tr>
          <tr>
            <td><strong>Owner</strong></td>
            <td>{task.metadata.owner}</td>
          </tr>
          <tr>
            <td><strong>TaskId</strong></td>
            <td>
              <a href={`https://queue.taskcluster.net/v1/task/${status.taskId}`} target="_blank">
                {status.taskId} <i className="fa fa-external-link" />
              </a>
            </td>
          </tr>
          <tr>
            <td><strong>State</strong></td>
            <td className={beautified.labelClassName(status.state)}>{status.state}</td>
          </tr>
          <tr>
            <td><strong>Actions</strong></td>
            <td>
              <ButtonToolbar className="toolbar-btn custom-btn">
                <ScheduleTaskButton />
                <RetriggerButton task={task} />
                <CancelTaskButton />
                <PurgeCacheButton
                  caches={task && task.payload && task.payload.cache ?
                    Object.keys(task.payload.cache) :
                    []}
                  provisionerId={task.provisionerId}
                  workerType={task.workerType} />
              </ButtonToolbar>
            </td>
          </tr>
          <tr>
            <td><strong>Debug</strong></td>
            <td>
              <ButtonToolbar className="toolbar-btn custom-btn">
                <EditAndCreateButton />
                <OneClickLoanerButton task={task} taskId={status.taskId} />
              </ButtonToolbar>
            </td>
          </tr>
          <tr>
            <td><strong>Dependencies</strong></td>
            <td>
              {dependenciesList}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}
