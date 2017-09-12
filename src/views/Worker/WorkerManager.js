import React from 'react';
import moment from 'moment';
import { Table, Button, ButtonToolbar } from 'react-bootstrap';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import SearchForm from './SearchForm';
import WorkerTable from './WorkerTable';
import styles from './styles.css';

class WorkerManager extends React.PureComponent {
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
    } catch (err) {
      this.setState({
        provisioners: [],
        error: err
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
    } catch (err) {
      this.setState({
        workerTypes: [],
        error: err
      });
    }
  }

  loadWorker = async (provisionerId, workerType, workerGroup, workerId) => {
    this.setState({ worker: null, loading: true, error: null }, async () => {
      try {
        const worker = await this.props.queue.getWorker(provisionerId, workerType, workerGroup, workerId);
        const recentTasks = await this.loadRecentTasks(worker.recentTasks);

        this.setState({ worker, recentTasks, loading: false, error: null });
      } catch (err) {
        this.setState({ worker: null, recentTasks: [], loading: false, error: err });
      }
    });
  };

  loadRecentTasks = taskIds => (
    Promise.all(taskIds.map(async (taskId) => {
      const task = this.props.queue.task(taskId);
      const status = this.props.queue.status(taskId);

      return { task: await task, status: (await status).status };
    }))
  );

  updateURI = (provisionerId, workerType, workerGroup, workerId, push) => {
    const encode = prop => (prop ? `/${encodeURIComponent(prop)}` : '');

    this.props.history[push ? 'push' : 'replace'](
      `/worker${encode(provisionerId)}${encode(workerType)}${encode(workerGroup)}${encode(workerId)}`
    );
  };

  render() {
    return (
      <div>
        <div key="header">
          <HelmetTitle title="Worker Explorer" />
          <h4>Worker Explorer</h4>
        </div>
        <SearchForm
          key="input-form"
          provisioners={this.state.provisioners}
          workerTypes={this.state.workerTypes}
          provisionerId={this.props.provisionerId}
          workerType={this.props.workerType}
          workerGroup={this.props.workerGroup}
          workerId={this.props.workerId}
          updateURI={this.updateURI}
          loadWorker={this.loadWorker} />
        {this.state.error && <Error key="error" error={this.state.error} />}
        {this.state.loading && <Spinner key="spinner" />}
        {this.state.worker &&
          <div>
            <Table className={styles.metadataTable} condensed responsive>
              <tbody>
                <tr>
                  <td>First Claim</td>
                  <td>{moment(this.state.worker.firstClaim).fromNow()}</td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: 'inherit' }}>Actions</td>
                  <td>
                    <ButtonToolbar>
                      <Button disabled title="Coming soon!" bsSize="small" bsStyle="info">Reboot</Button>
                      <Button disabled title="Coming soon!" bsSize="small" bsStyle="warning">Disable</Button>
                      <Button disabled title="Coming soon!" bsSize="small" bsStyle="danger">Kill</Button>
                    </ButtonToolbar>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        }
        {this.state.worker && <WorkerTable tasks={this.state.recentTasks} />}
      </div>
    );
  }
}

export default WorkerManager;
