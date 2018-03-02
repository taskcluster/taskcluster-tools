import { PureComponent } from 'react';
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
const sort = tasks =>
  tasks.sort((a, b) =>
    a.task.metadata.name.localeCompare(b.task.metadata.name, {
      sensitivity: 'base'
    })
  );

export default class GroupDetails extends PureComponent {
  static propTypes = {
    taskGroupId: string.isRequired,
    tasks: array
  };

  state = {
    sortedTasks: []
  };

  componentWillMount() {
    this.setState({
      sortedTasks: this.getTasksToRender(this.props)
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      sortedTasks: this.getTasksToRender(nextProps)
    });
  }

  getTasksToRender({ tasks, filterStatus }) {
    if (!tasks) {
      return [];
    }

    return sort(
      filterStatus === 'all'
        ? tasks
        : tasks.filter(task => task.status.state === filterStatus)
    );
  }

  render() {
    const { taskGroupId, tasks, filterStatus } = this.props;
    const { sortedTasks } = this.state;

    if (taskGroupId && !tasks && !sortedTasks.length) {
      return <Loading isLoading pastDelay />;
    }

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
            {sortedTasks.length ? (
              sortedTasks.map((task, index) => (
                <tr key={`inspector-task-row-${index}`}>
                  <td>
                    <Label bsSize="sm" bsStyle={labels[task.status.state]}>
                      {task.status.state}
                    </Label>
                  </td>
                  <td>
                    <Link
                      to={`/groups/${taskGroupId}/tasks/${
                        task.status.taskId
                      }/details`}
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
  }
}
