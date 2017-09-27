import React from 'react';
import moment from 'moment';
import { Table, Button, ButtonToolbar, OverlayTrigger, Tooltip, Breadcrumb } from 'react-bootstrap';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import SearchForm from './SearchForm';
import WorkerTable from './WorkerTable';
import styles from './styles.css';

export default class WorkerManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      provisioners: [],
      workerTypes: [],
      recentTasks: [],
      worker: null,
      error: null,
      loading: false
    };
  }

  componentWillMount() {
    const { provisionerId, workerType, workerGroup, workerId } = this.props;

    if (provisionerId && workerType && workerGroup && workerId) {
      this.loadWorker(provisionerId, workerType, workerGroup, workerId);
    }

    if (provisionerId) {
      this.loadWorkerTypes(this.props);
    }

    this.loadProvisioners();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.provisionerId !== nextProps.provisionerId) {
      this.setState({ workerTypes: [] }, () => this.loadWorkerTypes(nextProps));
    }
  }

  async loadProvisioners(token) {
    try {
      const { provisioners, continuationToken } = await this.props.queue
        .listProvisioners(token ? { continuationToken: token, limit: 100 } : { limit: 100 });

      this.setState({
        provisioners: this.state.provisioners ?
          this.state.provisioners.concat(provisioners) :
          provisioners
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

  async loadWorkerTypes({ provisionerId }, token) {
    try {
      const { workerTypes, continuationToken } = await this.props.queue
        .listWorkerTypes(provisionerId, token ? { continuationToken: token, limit: 100 } : { limit: 100 });

      this.setState({
        workerTypes: this.state.workerTypes ?
          this.state.workerTypes.concat(workerTypes) :
          workerTypes
      });

      if (continuationToken) {
        this.loadProvisioners({ provisionerId }, continuationToken);
      }
    } catch (error) {
      this.setState({
        workerTypes: [],
        error
      });
    }
  }

  loadWorker = async (provisionerId, workerType, workerGroup, workerId) => {
    this.setState({ worker: null, loading: true, error: null }, async () => {
      try {
        const worker = await this.props.queue.getWorker(provisionerId, workerType, workerGroup, workerId);
        const recentTasks = await this.loadRecentTasks(worker.recentTasks);

        this.setState({ worker, recentTasks, loading: false, error: null });
      } catch (error) {
        this.setState({ worker: null, recentTasks: [], loading: false, error });
      }
    });
  };

  loadRecentTasks = taskIds => Promise.all(taskIds.map(async (taskId) => {
    const [task, { status }] = await Promise.all([
      this.props.queue.task(taskId),
      this.props.queue.status(taskId)
    ]);

    return { task, status };
  }));

  updateURI = (provisionerId, workerType, workerGroup, workerId, push) => {
    const url = [provisionerId, workerType, workerGroup, workerId]
      .reduce((uri, param) => uri.concat(param ? `/${param}` : ''), '/workers');

    this.props.history[push ? 'push' : 'replace'](url);
  };

  toggleWorkerStatus = async () => {
    const { provisionerId, workerType, workerGroup, workerId, disabled } = this.state.worker;

    try {
      const worker = await this.props.queue.declareWorker(
        provisionerId, workerType, workerGroup, workerId, { disabled: !disabled }
      );

      this.setState({ worker });
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    const { provisioners, workerTypes, worker, recentTasks, loading, error } = this.state;
    const disableTooltip = (
      <Tooltip id="tooltip">
        {worker && worker.disabled ?
          'Enabling a worker will resume accepting jobs.' :
          'Disabling a worker allows the machine to remain alive but not accept jobs.'}
      </Tooltip>
    );

    return (
      <div>
        <div key="header">
          <HelmetTitle title="Worker Explorer" />
          <h4>Worker Explorer</h4>
        </div>
        <Breadcrumb>
          <Breadcrumb.Item href={`/workers/provisioners/${this.props.provisionerId}`}>
            {this.props.provisionerId}
          </Breadcrumb.Item>
          <Breadcrumb.Item href={`/workers/provisioners/${this.props.provisionerId}/worker-types/${this.props.workerType}`}>
            {this.props.workerType}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {this.props.workerGroup}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {this.props.workerId}
          </Breadcrumb.Item>
        </Breadcrumb>
        <SearchForm
          key="input-form"
          provisioners={provisioners}
          workerTypes={workerTypes}
          provisionerId={this.props.provisionerId}
          workerType={this.props.workerType}
          workerGroup={this.props.workerGroup}
          workerId={this.props.workerId}
          updateURI={this.updateURI}
          loadWorker={this.loadWorker} />
        {error && <Error key="error" error={error} />}
        {loading && <Spinner key="spinner" />}
        {worker && (
          <div>
            <Table className={styles.metadataTable} condensed responsive>
              <tbody>
                <tr>
                  <td>First Claim</td>
                  <td>{moment(worker.firstClaim).fromNow()}</td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: 'inherit' }}>Actions</td>
                  <td>
                    <ButtonToolbar>
                      <Button disabled title="Coming soon!" bsSize="small" bsStyle="info">Reboot</Button>
                      <OverlayTrigger delay={600} placement="bottom" overlay={disableTooltip}>
                        <Button
                          onClick={this.toggleWorkerStatus}
                          bsSize="small"
                          bsStyle="warning">
                          {worker.disabled ? 'Enable' : 'Disable'}
                        </Button>
                      </OverlayTrigger>
                      <Button disabled title="Coming soon!" bsSize="small" bsStyle="danger">Kill</Button>
                    </ButtonToolbar>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}
        {worker && <WorkerTable tasks={recentTasks} />}
      </div>
    );
  }
}
