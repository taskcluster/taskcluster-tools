import React from 'react';
import { array, string } from 'prop-types';
import {
  Table,
  Label,
  ButtonToolbar,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { titleCase } from 'change-case';
import Icon from 'react-fontawesome';
import Loading from '../../components/Loading';
import { labels } from '../../utils';

const groups = [
  'completed',
  'failed',
  'exception',
  'unscheduled',
  'running',
  'pending'
];

export default class GroupDetails extends React.PureComponent {
  static propTypes = {
    taskGroupId: string.isRequired,
    tasks: array
  };

  getTasksToRender() {
    const { tasks } = this.props;
    const { filterStatus } = this.props;

    if (!tasks) {
      return [];
    }

    const sort = tasks =>
      tasks.sort((a, b) =>
        a.task.metadata.name.localeCompare(b.task.metadata.name, {
          sensitivity: 'base'
        })
      );

    if (filterStatus !== 'all') {
      return sort(tasks.filter(task => task.status.state === filterStatus));
    }

    return sort(tasks);
  }

  render() {
    const { taskGroupId, tasks } = this.props;

    if (taskGroupId && !tasks) {
      return <Loading isLoading={true} pastDelay={true} />;
    }

    const { filterStatus } = this.props;
    const tasksToRender = this.getTasksToRender();

    return (
      <div>
        <Table>
          <thead>
            <tr>
              <th>
                <ButtonToolbar>
                  <DropdownButton
                    bsSize="xsmall"
                    title={`Status: ${titleCase(filterStatus)}`}
                    id="group-details-status-dropdown"
                    onSelect={this.props.onFilterChange}>
                    <MenuItem eventKey="all">All</MenuItem>
                    <MenuItem divider />
                    {groups.map(group => (
                      <MenuItem
                        eventKey={group}
                        key={`group-details-status-dropdown-${group}`}>
                        {titleCase(group)}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </ButtonToolbar>
              </th>
              <th>Name</th>
            </tr>
          </thead>

          <tbody>
            {tasksToRender.length ? (
              tasksToRender.map((task, index) => (
                <tr key={`inspector-task-row-${index}`}>
                  <td>
                    <Label bsSize="sm" bsStyle={labels[task.status.state]}>
                      {task.status.state}
                    </Label>
                  </td>
                  <td>
                    <Link
                      to={`/groups/${taskGroupId}/tasks/${task.status
                        .taskId}/details`}
                      replace>
                      {task.task.metadata.name}&nbsp;&nbsp;&nbsp;<Icon name="long-arrow-right" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr colSpan={2}>
                <td>
                  <em>
                    {filterStatus !== 'all'
                      ? `There are no tasks in this group in the "${filterStatus}" state`
                      : 'There are no tasks to display for this group'}
                  </em>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    );

    // <Table id="task-list-table" condensed={true} hover={true}>
    //   <thead>
    //   <tr>
    //     <th>
    //       State&nbsp;
    //       <Label
    //         bsSize="xs"
    //         bsStyle="info"
    //         style={{display: activeTaskStatus ? 'inline' : 'none', float: 'right', cursor: 'pointer'}}
    //         onClick={() => this.clearFilter()}>
    //         <Glyphicon glyph="remove" /> Clear
    //       </Label>
    //     </th>
    //     <th>Name</th>
    //   </tr>
    //   </thead>
    //   <tbody className="tasks-list-body">
    //   {
    //     tasks
    //       .sort((a, b) => a.task.metadata.name.localeCompare(b.task.metadata.name, {
    //         sensitivity: 'base',
    //       }))
    //       .reduce((rows, task, key) => {
    //         if (!activeTaskStatus || task.status.state === activeTaskStatus) {
    //           rows.push(
    //             <tr onClick={() => this.taskClicked(task)} key={key}>
    //               <td>
    //                 <Label bsSize="sm" bsStyle={labels[task.status.state]}>{task.status.state}</Label>
    //               </td>
    //               <td>{task.task.metadata.name}</td>
    //             </tr>
    //           );
    //         }
    //
    //         return rows;
    //       }, [])
    //   }
    //   </tbody>
    // </Table>
  }
}
