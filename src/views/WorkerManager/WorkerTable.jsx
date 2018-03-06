import { PureComponent } from 'react';
import {
  Table,
  Label,
  Popover,
  OverlayTrigger,
  ButtonToolbar,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { array } from 'prop-types';
import Icon from 'react-fontawesome';
import { titleCase } from 'change-case';
import Markdown from '../../components/Markdown';
import DateView from '../../components/DateView';
import { labels } from '../../utils';
import styles from './styles.module.css';

export default class WorkerTable extends PureComponent {
  static propTypes = {
    tasks: array.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      filterStatus: 'all'
    };
  }

  renderTaskDescription = ({ description, source }) => (
    <Popover
      className={styles.taskPopover}
      id="popover-trigger-click-root-close"
      title="Description">
      <div>
        {description ? (
          <Markdown>{description}</Markdown>
        ) : (
          <Markdown>`-`</Markdown>
        )}
        <hr />
        <div className={styles.sourcePopover}>
          <strong>Source: </strong>
          <a target="_blank" rel="noopener noreferrer" href={source}>
            {source}
          </a>
        </div>
      </div>
    </Popover>
  );

  renderTask = ({ task, status, runId }, index) => {
    const run = status.runs[runId];
    const description = this.renderTaskDescription(task.metadata);

    return (
      <tr key={`recent-task-${index}`}>
        <td>
          <Label bsSize="sm" bsStyle={labels[run.state]}>
            {run.state}
          </Label>
        </td>
        <td>
          <OverlayTrigger
            trigger="click"
            rootClose
            placement="bottom"
            overlay={description}>
            <Icon role="button" name="info" />
          </OverlayTrigger>&nbsp;&nbsp;
          <Link
            to={`/groups/${status.taskGroupId}/tasks/${
              status.taskId
            }/runs/${runId}`}>
            {task.metadata.name}&nbsp;&nbsp;&nbsp;<Icon name="long-arrow-right" />
          </Link>
        </td>
        <td>{status.taskId}</td>
        <td>
          {run.started ? (
            <DateView placement="bottom" date={run.started} />
          ) : (
            '-'
          )}
        </td>
        <td>
          {run.resolved ? (
            <DateView placement="bottom" date={run.resolved} />
          ) : (
            '-'
          )}
        </td>
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

    const sort = tasks =>
      tasks.sort((a, b) => {
        const diff = moment(a.status.runs[a.runId].started).diff(
          moment(b.status.runs[b.runId].started)
        );

        if (diff === 0) {
          return 0;
        }

        return diff < 0 ? 1 : -1;
      });

    if (filterStatus !== 'all') {
      return sort(
        tasks.filter(
          task => task.status.runs[task.runId].state === filterStatus
        )
      );
    }

    return sort(tasks);
  };

  render() {
    const groups = Object.keys(labels).filter(
      label => !label.includes('pending')
    );
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
              <th>Task ID</th>
              <th>Started</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {tasksToRender.length ? (
              tasksToRender.map(this.renderTask)
            ) : (
              <tr colSpan={2}>
                <td>
                  <em>
                    {filterStatus !== 'all'
                      ? `There are no tasks in this worker in the "${filterStatus}" state.`
                      : 'There are no tasks to display for this worker.'}
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
