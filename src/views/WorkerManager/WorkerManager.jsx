import { PureComponent } from 'react';
import moment from 'moment';
import {
  Table,
  Button,
  ButtonToolbar,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { request } from 'taskcluster-client-web';
import { tail } from 'ramda';
import 'react-datepicker/dist/react-datepicker.css';
import HelmetTitle from '../../components/HelmetTitle';
import QuarantineButton from '../../components/QuarantineButton';
import Breadcrumb from '../../components/Breadcrumb';
import Snackbar from '../../components/Snackbar';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import UserSession from '../../auth/UserSession';
import SearchForm from './SearchForm';
import WorkerTable from './WorkerTable';
import styles from './styles.module.css';

export default class WorkerManager extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      provisioners: [],
      workerTypes: [],
      recentTasks: [],
      worker: null,
      error: null,
      loading: false,
      actionLoading: false,
      toasts: []
    };
  }

  componentWillMount() {
    const { provisionerId, workerType, workerGroup, workerId } = this.props;

    if (provisionerId && workerType && workerGroup && workerId) {
      this.handleLoadWorker(provisionerId, workerType, workerGroup, workerId);
    }

    if (provisionerId) {
      this.handleLoadWorkerTypes(provisionerId);
    }

    this.loadProvisioners();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  async loadProvisioners(token) {
    try {
      const {
        provisioners,
        continuationToken
      } = await this.props.queue.listProvisioners(
        token ? { continuationToken: token, limit: 100 } : { limit: 100 }
      );

      this.setState({
        provisioners: this.state.provisioners
          ? this.state.provisioners.concat(provisioners)
          : provisioners
      });

      if (continuationToken) {
        this.loadProvisioners(continuationToken);
      }
    } catch (error) {
      this.setState({
        provisioners: [],
        error
      });
    }
  }

  handleLoadWorkerTypes = async (provisionerId, token) => {
    try {
      const {
        workerTypes,
        continuationToken
      } = await this.props.queue.listWorkerTypes(
        provisionerId,
        token ? { continuationToken: token, limit: 100 } : { limit: 100 }
      );

      this.setState({
        workerTypes:
          this.state.workerTypes && this.props.provisionerId === provisionerId
            ? this.state.workerTypes.concat(workerTypes)
            : workerTypes
      });

      if (continuationToken) {
        this.handleLoadWorkerTypes(provisionerId, continuationToken);
      }
    } catch (error) {
      this.setState({
        workerTypes: [],
        error
      });
    }
  };

  handleLoadWorker = async (
    provisionerId,
    workerType,
    workerGroup,
    workerId
  ) => {
    this.setState({ worker: null, loading: true, error: null }, async () => {
      try {
        const worker = await this.props.queue.getWorker(
          provisionerId,
          workerType,
          workerGroup,
          workerId
        );
        const recentTasks = await this.handleLoadRecentTasks(
          worker.recentTasks
        );

        this.setState({ worker, recentTasks, loading: false, error: null });
      } catch (error) {
        this.setState({ worker: null, recentTasks: [], loading: false, error });
      }
    });
  };

  handleLoadRecentTasks = recentTasks =>
    Promise.all(
      recentTasks.map(async ({ taskId, runId }) => {
        const [task, { status }] = await Promise.all([
          this.props.queue.task(taskId),
          this.props.queue.status(taskId)
        ]);

        return { task, status, runId };
      })
    );

  handleUpdateURI = (provisionerId, workerType, workerGroup, workerId) => {
    const url = `/provisioners/${provisionerId}/worker-types/${workerType}/workers/${workerGroup}/${workerId}`;

    this.props.history.push(url);
  };

  handleUpdateWorkerQuarantine = async quarantineUntil => {
    const {
      provisionerId,
      workerType,
      workerGroup,
      workerId
    } = this.state.worker;

    try {
      const worker = await this.props.queue.quarantineWorker(
        provisionerId,
        workerType,
        workerGroup,
        workerId,
        {
          quarantineUntil
        }
      );

      this.setState({ worker });
    } catch (error) {
      this.setState({ error });
    }
  };

  handleActionClick = action => {
    const url = action.url
      .replace('<provisionerId>', this.state.worker.provisionerId)
      .replace('<workerType>', this.state.worker.workerType)
      .replace('<workerGroup>', this.state.worker.workerGroup)
      .replace('<workerId>', this.state.worker.workerId);

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
      provisioners,
      workerTypes,
      worker,
      recentTasks,
      loading,
      error,
      actionLoading
    } = this.state;
    const { provisionerId, workerType, workerGroup, workerId } = this.props;
    const quarantineTooltip = (
      <Tooltip id="quarantine-tooltip">
        {worker && worker.quarantineUntil
          ? 'Enabling a worker will resume accepting jobs.'
          : 'Quarantining a worker allows the machine to remain alive but not accept jobs.'}
      </Tooltip>
    );
    const firstClaim = worker && moment(worker.firstClaim);
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
        title: workerType,
        href: `/provisioners/${provisionerId}/worker-types/${workerType}`
      },
      {
        title: workerGroup
      },
      {
        title: workerId
      }
    ];

    return (
      <div>
        <div key="header">
          <HelmetTitle title="Worker Explorer" />
          <h4>Worker Explorer</h4>
        </div>
        <Snackbar
          toasts={this.state.toasts}
          onDismiss={this.handleToastDismiss}
        />
        <Breadcrumb navList={navList} active={[workerGroup, workerId]} />
        <SearchForm
          key="input-form"
          provisioners={provisioners}
          workerTypes={workerTypes}
          provisionerId={provisionerId}
          workerType={workerType}
          workerGroup={workerGroup}
          workerId={workerId}
          onUpdateURI={this.handleUpdateURI}
          onLoadWorker={this.handleLoadWorker}
          onLoadWorkerTypes={this.handleLoadWorkerTypes}
        />
        {error && <Error key="error" error={error} />}
        {loading && <Spinner key="spinner" />}
        {worker && (
          <div>
            <Table className={styles.metadataTable} condensed responsive>
              <tbody>
                <tr>
                  <td>First Claim</td>
                  <td>
                    {firstClaim.isAfter('2000-01-01')
                      ? firstClaim.fromNow()
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: 'inherit' }}>Actions</td>
                  <td>
                    <ButtonToolbar>
                      <OverlayTrigger
                        delay={600}
                        placement="top"
                        overlay={quarantineTooltip}>
                        <div>
                          <QuarantineButton
                            className={styles.actionButton}
                            onSubmit={this.handleUpdateWorkerQuarantine}
                            quarantineUntil={worker.quarantineUntil}
                          />
                        </div>
                      </OverlayTrigger>
                      {worker.actions.map((action, key) => (
                        <OverlayTrigger
                          key={`worker-action-${key}`}
                          delay={600}
                          placement="top"
                          overlay={
                            <Tooltip id={`action-tooltip-${key}`}>
                              {action.description}
                            </Tooltip>
                          }>
                          <Button
                            className={styles.actionButton}
                            bsSize="small"
                            disabled={actionLoading}
                            onClick={() => this.handleActionClick(action)}>
                            {action.title}
                          </Button>
                        </OverlayTrigger>
                      ))}
                    </ButtonToolbar>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}
        {actionLoading && <Spinner />}
        {worker && <WorkerTable tasks={recentTasks} />}
      </div>
    );
  }
}
