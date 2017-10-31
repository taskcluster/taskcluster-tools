import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  Button,
  ButtonGroup,
  Glyphicon,
  DropdownButton,
  MenuItem,
  Label
} from 'react-bootstrap';
import HelmetTitle from '../../components/HelmetTitle';
import Breadcrumb from '../../components/Breadcrumb';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';
import { labels } from '../../utils';
import styles from './styles.css';

export default class WorkerManager extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      workers: null,
      workerToken: null,
      error: null,
      filter: 'None'
    };
  }

  componentWillMount() {
    this.loadWorkers(this.props);
  }

  componentDidUpdate(prevProps, { workerToken, filter }) {
    const filterChanged = filter !== this.state.filter;

    if (workerToken !== this.state.workerToken || filterChanged) {
      this.setState(
        {
          loading: true,
          ...(filterChanged ? { workers: null } : {})
        },
        () => this.loadWorkers(this.props)
      );
    }

    // Edge case with azure not returning a list but has a continuationToken
    if (
      this.state.workers &&
      !this.state.workers.workers.length &&
      this.state.workers.continuationToken
    ) {
      this.nextWorkers();
    }
  }

  loadStatus = async latestTask => {
    if (!latestTask) {
      return {};
    }

    const { status } = await this.props.queue.status(latestTask.taskId);
    const { state, started, resolved } = status.runs[latestTask.runId];

    return {
      state,
      taskGroupId: status.taskGroupId,
      lastClaimStarted: started,
      lastClaimResolved: resolved
    };
  };

  async loadWorkers({ provisionerId, workerType }) {
    try {
      const workers = await this.props.queue.listWorkers(
        provisionerId,
        workerType,
        {
          ...(this.state.workerToken
            ? { continuationToken: this.state.workerToken }
            : {}),
          ...{ limit: 15 },
          ...(this.state.filter.includes('disabled') ? { disabled: true } : {})
        }
      );

      workers.workers = await Promise.all(
        workers.workers.map(async worker => ({
          ...worker,
          ...(await this.loadStatus(worker.latestTask))
        }))
      );

      this.setState({ workers, loading: false, error: null });
    } catch (error) {
      this.setState({ workers: null, loading: false, error });
    }
  }

  clearWorkerToken = () =>
    !this.state.loading && this.setState({ workerToken: null });

  nextWorkers = () =>
    !this.state.loading &&
    this.setState({ workerToken: this.state.workers.continuationToken });

  onFilterSelect = filter =>
    this.setState({
      filter: filter.includes('disabled') ? 'disabled' : filter
    });

  render() {
    const { filter, workers, workerToken, loading, error } = this.state;
    const { provisionerId, workerType } = this.props;
    const navList = [
      {
        title: provisionerId,
        href: `/provisioners/${provisionerId}`
      },
      {
        title: 'worker-types',
        href: `/provisioners/${provisionerId}/worker-types`
      },
      {
        title: workerType
      }
    ];

    return (
      <div>
        <div key="header">
          <HelmetTitle title="Workers" />
          <h4>Workers Explorer</h4>
        </div>
        <Breadcrumb navList={navList} active={workerType} />
        <div className={styles.filters}>
          <DropdownButton
            id="workers-dropdown"
            bsSize="small"
            title={`Filter by: ${filter || 'None'}`}
            onSelect={this.onFilterSelect}>
            <MenuItem eventKey="None">None</MenuItem>
            <MenuItem divider />
            {['Status: disabled'].map((property, key) => (
              <MenuItem eventKey={property} key={`workers-dropdown-${key}`}>
                {property}
              </MenuItem>
            ))}
          </DropdownButton>
        </div>
        {error && <Error error={error} />}
        {loading && <Spinner />}
        <Table
          className={styles.workersTable}
          responsive
          condensed={true}
          hover={true}>
          <thead>
            <tr>
              <th>Worker Group</th>
              <th>Worker ID</th>
              <th>Most Recent Task</th>
              <th>Task State</th>
              <th>Task Started</th>
              <th>Task Resolved</th>
              <th>First Claim</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              workers &&
              workers.workers.map((worker, index) => (
                <tr key={`worker-${index}`}>
                  <td>{worker.workerGroup}</td>
                  <td>
                    <Link
                      to={`/provisioners/${provisionerId}/worker-types/${workerType}/workers/${worker.workerGroup}/${worker.workerId}`}>
                      {worker.workerId}
                    </Link>
                  </td>
                  <td>
                    {worker.latestTask ? (
                      <Link
                        to={`/groups/${worker.taskGroupId}/tasks/${worker
                          .latestTask.taskId}/runs/${worker.latestTask.runId}`}>
                        {worker.latestTask.taskId}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Label bsSize="sm" bsStyle={labels[worker.state]}>
                      {worker.state}
                    </Label>
                  </td>
                  <td>
                    {worker.lastClaimStarted ? (
                      <DateView date={worker.lastClaimStarted} />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {worker.lastClaimResolved ? (
                      <DateView
                        date={worker.lastClaimResolved}
                        since={worker.lastClaimStarted}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {worker.firstClaim ? (
                      <DateView date={worker.firstClaim} />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Label
                      bsSize="sm"
                      bsStyle={worker.disabled ? 'danger' : 'success'}>
                      {worker.disabled ? 'disabled' : 'enabled'}
                    </Label>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
        {workers &&
          !workers.workers.length &&
          !loading && (
            <div>
              There are no {filter !== 'None' ? filter : ''} workers in{' '}
              <code>{`${provisionerId}/${workerType}`}</code>
            </div>
          )}
        <div className={styles.pagination}>
          <ButtonGroup>
            <Button disabled={!workerToken} onClick={this.clearWorkerToken}>
              <Glyphicon glyph="arrow-left" />&nbsp;&nbsp;Back to start
            </Button>
            <Button
              disabled={workers && !workers.continuationToken}
              onClick={this.nextWorkers}>
              More workers&nbsp;&nbsp;<Glyphicon glyph="arrow-right" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}
