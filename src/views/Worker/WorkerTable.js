import React from 'react';
import { Table, Label, Popover, OverlayTrigger, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';
import moment from 'moment';
import { array } from 'prop-types';
import Icon from 'react-fontawesome';
import { titleCase } from 'change-case';
import Markdown from '../../components/Markdown';
import { labels } from '../../utils';
import styles from './styles.css';

export default class WorkerTable extends React.PureComponent {
  static propTypes = {
    tasks: array.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      filterStatus: 'all'
    };
  }
  renderTaskDescription = description => (
    <Popover
      className={styles.taskPopover}
      id="popover-trigger-click-root-close"
      title="Description">
      <div>
        {description ?
          <Markdown>{description}</Markdown> :
          <Markdown>`-`</Markdown>
        }
      </div>
    </Popover>
  );

  renderTask = ({ task, status }, index) => {
    const runId = status.runs.length - 1;
    const run = status.runs[runId];
    const description = this.renderTaskDescription(task.metadata.description);

    return (
      <tr key={`recent-task-${index}`}>
        <td><Label bsSize="sm" bsStyle={labels[status.state]}>{status.state}</Label></td>
        <td>
          <a target="_blank" rel="noopener noreferrer" href={`/groups/${status.taskGroupId}/tasks/${status.taskId}`}>
            {status.taskId}
          </a>
        </td>
        <td>
          <a target="_blank" rel="noopener noreferrer" href={task.metadata.source}>
            {task.metadata.name}
          </a>
          &nbsp;&nbsp;
          <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={description}>
            <Icon role="button" name="info-circle" />
          </OverlayTrigger>
        </td>
        <td>{run.started ? moment(run.started).fromNow() : '-'}</td>
        <td>{run.resolved ? moment(run.resolved).fromNow() : '-'}</td>
      </tr>
    );
  };

  handleSelect = filterStatus => this.setState({ filterStatus });

  tasksToRender = () => {
    const { tasks } = this.props;
    const { filterStatus } = this.state;

    if (!tasks) {
      return [];
    }

    const sort = tasks => tasks
      .sort((a, b) => {
        const runIdA = a.status.runs.length - 1;
        const runIdB = b.status.runs.length - 1;

        return moment(a.status.runs[runIdA].started).diff(moment(b.status.runs[runIdB].started)) < 0 ? 1 : -1;
      }
    );

    if (filterStatus !== 'all') {
      return sort(tasks.filter(task => task.status.state === filterStatus));
    }

    return sort(tasks);
  };

  render() {
    const groups = Object.keys(labels);
    const tasksToRender = this.tasksToRender();
    const { filterStatus } = this.state;

    return (
      <div className={styles.tasksTable}>
        <hr />
        <h5>Recent Task IDs claimed</h5>
        <Table responsive>
          <thead>
            <tr>
              <th>
                <ButtonToolbar>
                  <DropdownButton
                    bsSize="xsmall"
                    title={`Status: ${titleCase(filterStatus)}`}
                    id="group-details-status-dropdown"
                    onSelect={this.handleSelect}>
                    <MenuItem eventKey="all">All</MenuItem>
                    <MenuItem divider />
                    {groups.map(group => (
                      <MenuItem eventKey={group} key={`group-details-status-dropdown-${group}`}>
                        {titleCase(group)}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </ButtonToolbar>
              </th>
              <th>Task ID</th>
              <th>Name</th>
              <th>Started</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {tasksToRender.length ?
              tasksToRender.map(this.renderTask) :
              (
                <tr colSpan={2}>
                  <td>
                    <em>
                      {
                        filterStatus !== 'all' ?
                          `There are no tasks in this worker in the "${filterStatus}" state` :
                          'There are no tasks to display for this worker'
                      }
                    </em>
                  </td>
                </tr>
              )
            }
          </tbody>
        </Table>
      </div>
    );
  }
}
