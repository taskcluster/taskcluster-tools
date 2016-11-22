import React, {Component} from 'react';
import {hashHistory} from 'react-router';
import {connect} from 'react-redux';
import {Table, Label, Glyphicon} from 'react-bootstrap';
import * as actions from '../actions';
import {labels} from '../lib/utils';

class TaskTable extends Component {
  /**
  * Navigate to appropriate route
  */
  taskClicked(task) {
    hashHistory.push(`${task.status.taskGroupId}/${task.status.taskId}`);
  }

  /**
  * Clear current status filter
  */
  clearFilter() {
    this.props.setActiveTaskStatus(null);
  }

  render() {
    const {activeTaskStatus, tasks = []} = this.props;

    return (
      <Table id="task-list-table" condensed={true} hover={true}>
        <thead>
          <tr>
            <th>
              State&nbsp;
              <Label
                bsSize="xs"
                bsStyle="info"
                style={{display: activeTaskStatus ? 'inline' : 'none', float: 'right', cursor: 'pointer'}}
                onClick={() => this.clearFilter()}>
                <Glyphicon glyph="remove" /> Clear
              </Label>
            </th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody className="tasks-list-body">
          {
            tasks
              .sort((a, b) => a.task.metadata.name.localeCompare(b.task.metadata.name, {
                sensitivity: 'base',
              }))
              .reduce((rows, task, key) => {
                if (!activeTaskStatus || task.status.state === activeTaskStatus) {
                  rows.push(
                    <tr onClick={() => this.taskClicked(task)} key={key}>
                      <td>
                        <Label bsSize="sm" bsStyle={labels[task.status.state]}>{task.status.state}</Label>
                      </td>
                      <td>{task.task.metadata.name}</td>
                    </tr>
                  );
                }

                return rows;
              }, [])
          }
        </tbody>
      </Table>
    );
  }
}

const mapStateToProps = ({tasks, activeTaskStatus}) => ({tasks, activeTaskStatus});

export default connect(mapStateToProps, actions)(TaskTable);
