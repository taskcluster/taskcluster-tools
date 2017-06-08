import React from 'react';
import {Button, Table, Label} from 'react-bootstrap';
import ConfirmAction from './confirmaction';
import LoanerButton from './loaner-button';
import _ from 'lodash';
import {Markdown, DateView, Code} from '../format';
import path from 'path';
import './taskinfo.less';

/** Displays information about a task in a tab page */
const TaskInfo = React.createClass({
  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired,
    task: React.PropTypes.object.isRequired,
  },

  render() {
    const {status, task} = this.props;
    const taskStateLabel = {
      unscheduled: 'default',
      pending: 'info',
      running: 'primary',
      completed: 'success',
      failed: 'danger',
      exception: 'warning',
    };

    return (
      <div>
        <Table>
          <tbody>
            <tr>
              <td>Name</td>
              <td><Markdown>{task.metadata.name}</Markdown></td>
            </tr>

            <tr>
              <td>Description</td>
              <td><Markdown>{task.metadata.description}</Markdown></td>
            </tr>

            <tr>
              <td>Owner</td>
              <td><code>{task.metadata.owner}</code></td>
            </tr>

            <tr>
              <td>Source</td>
              <td>
                <a href={task.metadata.source}>
                  {
                    task.metadata.source.length > 90 ? (
                      <span>...{task.metadata.source.substr(8 - 90)}</span>
                    ) : (
                      <span>{task.metadata.source}</span>
                    )
                  }
                </a>
              </td>
            </tr>

            <tr>
              <td>State</td>
              <td>
                <Label bsStyle={taskStateLabel[status.state]}>
                  {status.state}
                </Label>
              </td>
            </tr>

            <tr>
              <td>Retries Left</td>
              <td>{status.retriesLeft} of {task.retries}</td>
            </tr>

            <tr>
              <td>Created</td>
              <td><DateView date={task.created} /></td>
            </tr>

            <tr>
              <td>Deadline</td>
              <td><DateView date={task.deadline} since={task.created} /></td>
            </tr>

            <tr>
              <td>Priority</td>
              <td><code>{task.priority}</code></td>
            </tr>

            <tr>
              <td>Provisioner</td>
              <td><code>{task.provisionerId}</code></td>
            </tr>

            <tr>
              <td>WorkerType</td>
              <td><code>{task.workerType}</code></td>
            </tr>

            <tr>
              <td>SchedulerId</td>
              <td><code>{task.schedulerId}</code></td>
            </tr>

            <tr>
              <td>TaskGroupId</td>
              <td>
                <a href={`../task-group-inspector/#/${task.taskGroupId}`}>{task.taskGroupId}</a>
              </td>
            </tr>

            <tr>
              <td>Dependencies</td>
              <td>
                {
                  task.dependencies.length ?
                    task.dependencies.map((dependency, key) => (
                      <div key={key}>
                        <a href={`../task-inspector/#${dependency}`}>{dependency}</a>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Tags</td>
              <td>
                <table className="tag-table">
                  <tr>
                    <th>Tag</th><th>Value</th>
                  </tr>
                  {
                    Object
                      .entries(task.tags)
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td><td>{value}</td>
                        </tr>
                      ))
                  }
                </table>
              </td>
            </tr>

            <tr>
              <td>Requires</td>
              <td>
                This task will be scheduled when <em>dependencies</em> are
                {
                  task.requires === 'all-completed' ? (
                    <span> <code>all-completed</code> successfully.</span>
                  ) : (
                    <span> <code>all-resolved</code> with any resolution.</span>
                  )
                }
              </td>
            </tr>

            <tr>
              <td>Scopes</td>
              <td>
                {
                  task.scopes.length ?
                    task.scopes.map((scope, key) => (
                      <div key={key}>
                        <code>{scope}</code>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Routes</td>
              <td>
                {
                  task.routes.length ?
                    task.routes.map((route, key) => (
                      <div key={key}>
                        <code>{route}</code>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Task Definition</td>
              <td>
                <a
                  href={`https://queue.taskcluster.net/v1/task/${status.taskId}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {status.taskId} <i className="fa fa-external-link" />
                </a>
              </td>
            </tr>

            <tr>
              <td>Payload</td>
              <td>
                <Code language="json">
                  {JSON.stringify(task.payload, null, 2)}
                </Code>
              </td>
            </tr>

            {Object.keys(task.extra).length > 0 && ( 
              <tr>
                <td>Extra</td>
                <td>
                  <Code language="json">
                    {JSON.stringify(task.extra, null, 2)}
                  </Code>
                </td>
              </tr>
            )}

            <tr>
              <td>Debug</td>
              <td>
                <ConfirmAction
                  buttonSize="small"
                  buttonStyle="default"
                  glyph="edit"
                  label="Edit and Re-create"
                  action={this.editTask}
                  success="Opening Task Creator">
                  Are you sure you wish to edit this task?<br />
                  Note that the edited task will not be linked to other tasks or
                  have the same <code>task.routes</code> as other tasks,
                  so this is not a way to "fix" a failing task in a larger task graph.
                  Note that you may also not have the scopes required to create the
                  resulting task.
                </ConfirmAction>&nbsp;
                <LoanerButton
                  task={this.props.task}
                  taskId={status.taskId}
                  buttonStyle="default"
                  buttonSize="small" />&nbsp;
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  },

  rerunTask() {
    return this.queue.rerunTask(this.props.status.taskId);
  },

  editTask() {
    const newTask = {};
    // copy fields from the parent task, intentionally excluding some
    // fields which might cause confusion if left unchanged
    const exclude = [
      'routes',
      'taskGroupId',
      'schedulerId',
      'priority',
      'dependencies',
      'requires',
    ];

    _.keys(this.props.task).forEach(key => {
      if (!_.includes(exclude, key)) {
        newTask[key] = this.props.task[key];
      }
    });

    // overwrite task-creator's local state with this new task
    localStorage.setItem('task-creator/task', JSON.stringify(newTask));

    // ..and go there
    window.location.href = '../task-creator';
  },
});

export default TaskInfo;
