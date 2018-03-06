import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Glyphicon,
  DropdownButton,
  MenuItem,
  Label,
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { request } from 'taskcluster-client-web';
import moment from 'moment';
import { tail } from 'ramda';
import HelmetTitle from '../../components/HelmetTitle';
import Breadcrumb from '../../components/Breadcrumb';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import Snackbar from '../../components/Snackbar';
import DateView from '../../components/DateView';
import { labels } from '../../utils';
import styles from './styles.module.css';

export default class WorkerManager extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      actionLoading: false,
      workers: null,
      actions: [],
      workerToken: null,
      error: null,
      filter: 'None',
      toasts: []
    };
  }

  componentWillMount() {
    this.loadWorkers(this.props);
    this.loadActions(this.props);
  }

  componentDidUpdate(prevProps, { workerToken, filter }) {
    const filterChanged = filter !== this.state.filter;

    if (workerToken !== this.state.workerToken || filterChanged) {
      // eslint-disable-next-line react/no-did-update-set-state
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
      this.handleNextWorkers();
    }
  }

  loadStatus = async latestTask => {
    if (!latestTask) {
      return {};
    }

    try {
      const { status } = await this.props.queue.status(latestTask.taskId);
      const { state, started, resolved } = status.runs[latestTask.runId];

      return {
        state,
        taskGroupId: status.taskGroupId,
        lastClaimStarted: started,
        lastClaimResolved: resolved
      };
    } catch (error) {
      if (error.response.statusCode === 404) {
        return null;
      }

      this.setState({ error });
    }
  };

  async loadActions({ provisionerId, workerType }) {
    try {
      const { actions } = await this.props.queue.getWorkerType(
        provisionerId,
        workerType
      );

      this.setState({ actions });
    } catch (error) {
      this.setState({ error });
    }
  }

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
          ...(this.state.filter === 'quarantined' ? { quarantined: true } : {})
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

  handleClearWorkerToken = () =>
    !this.state.loading && this.setState({ workerToken: null });

  handleNextWorkers = () =>
    !this.state.loading &&
    this.setState({ workerToken: this.state.workers.continuationToken });

  handleFilterSelect = filter => this.setState({ filter });

  handleActionClick = async action => {
    const url = action.url
      .replace('<provisionerId>', this.props.provisionerId)
      .replace('<workerType>', this.props.workerType);

    this.setState({ actionLoading: true }, async () => {
      try {
        const credentials =
          (this.props.userSession &&
            (await this.props.userSession.getCredentials())) ||
          {};

        await request(url, {
          extra: this.props.queue.buildExtraData(credentials),
          credentials,
          method: action.method
        });

        const toast = {
          text: action.title,
          icon: <Icon name="check" />
        };

        this.setState({
          actionLoading: false,
          toasts: this.state.toasts.concat(toast)
        });
      } catch (error) {
        this.setState({ error, actionLoading: false });
      }
    });
  };

  handleToastDismiss = () => this.setState({ toasts: tail(this.state.toasts) });

  render() {
    const {
      filter,
      workers,
      workerToken,
      loading,
      error,
      actions,
      actionLoading
    } = this.state;
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
        <Snackbar
          toasts={this.state.toasts}
          onDismiss={this.handleToastDismiss}
        />
        <Breadcrumb navList={navList} active={workerType} />
        <div className={styles.filters}>
          <ButtonToolbar className={styles.buttonToolbar}>
            <DropdownButton
              id="workers-dropdown"
              bsSize="small"
              title={`Filter by: ${filter || 'None'}`}
              onSelect={this.handleFilterSelect}>
              <MenuItem eventKey="None">None</MenuItem>
              <MenuItem divider />
              <MenuItem eventKey="quarantined">Quarantined</MenuItem>
            </DropdownButton>

            <DropdownButton
              id="actions-dropdown"
              bsSize="small"
              title="Actions"
              disabled={actionLoading || !actions.length}>
              {actions.map((action, key) => (
                <OverlayTrigger
                  key={`action-dropdown-${key}`}
                  delay={600}
                  placement="right"
                  overlay={
                    <Tooltip id={`action-tooltip-${key}`}>
                      {action.description}
                    </Tooltip>
                  }>
                  <MenuItem onSelect={this.handleActionClick} eventKey={action}>
                    {action.title}
                  </MenuItem>
                </OverlayTrigger>
              ))}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        {error && <Error error={error} />}
        {actionLoading && <Spinner />}
        {loading && <Spinner />}
        <Table className={styles.workersTable} responsive condensed hover>
          <thead>
            <tr>
              <th>Worker Group</th>
              <th>Worker ID</th>
              <th>Most Recent Task</th>
              <th>Task State</th>
              <th>Task Started</th>
              <th>Task Resolved</th>
              <th>First Claim</th>
              <th>Quarantined</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              workers &&
              workers.workers.map(
                (worker, index) =>
                  worker.state && (
                    <tr key={`worker-${index}`}>
                      <td>{worker.workerGroup}</td>
                      <td>
                        <Link
                          to={`/provisioners/${provisionerId}/worker-types/${workerType}/workers/${
                            worker.workerGroup
                          }/${worker.workerId}`}>
                          {worker.workerId}
                        </Link>
                      </td>
                      <td>
                        {worker.latestTask ? (
                          <Link
                            to={`/groups/${worker.taskGroupId}/tasks/${
                              worker.latestTask.taskId
                            }/runs/${worker.latestTask.runId}`}>
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
                        {worker.quarantineUntil
                          ? `${moment(worker.quarantineUntil).diff(
                              moment(),
                              'days'
                            )} days`
                          : '-'}
                      </td>
                    </tr>
                  )
              )}
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
            <Button
              disabled={!workerToken}
              onClick={this.handleClearWorkerToken}>
              <Glyphicon glyph="arrow-left" />&nbsp;&nbsp;Back to start
            </Button>
            <Button
              disabled={workers && !workers.continuationToken}
              onClick={this.handleNextWorkers}>
              More workers&nbsp;&nbsp;<Glyphicon glyph="arrow-right" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}
