import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Breadcrumb, Button, Glyphicon, DropdownButton, MenuItem, Label } from 'react-bootstrap';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';
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

  componentDidUpdate(prevProps, prevState) {
    if (prevState.workerToken !== this.state.workerToken) {
      this.setState({ loading: true }, () => this.loadWorkers(this.props));
    }

    if (prevState.filter !== this.state.filter) {
      this.setState({ workers: null, loading: true }, () => this.loadWorkers(this.props));
    }
  }

  async loadWorkers({ provisionerId, workerType }) {
    try {
      const workers = await this.props.queue.listWorkers(provisionerId, workerType, {
        ...this.state.workerToken ? { continuationToken: this.state.workerToken } : {},
        ...{ limit: 15 },
        ...this.state.filter.includes('disabled') ? { disabled: true } : {}
      });

      this.setState({ workers, loading: false, error: null });
    } catch (error) {
      this.setState({ workers: null, loading: false, error });
    }
  }

  clearWorkerToken = () => this.setState({ workerToken: null });

  nextWorkers = () => this.setState({ workerToken: this.state.workers.continuationToken });

  onFilterSelect = filter => this.setState({ filter: filter.includes('disabled') ? 'disabled' : filter });

  render() {
    return (
      <div>
        <div key="header">
          <HelmetTitle title="Workers" />
          <h4>Workers</h4>
        </div>
        <div>
          <Breadcrumb>
            <Breadcrumb.Item href={`/workers/provisioners/${this.props.provisionerId}`}>
              {this.props.provisionerId}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
              {this.props.workerType}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className={styles.filters}>
          <DropdownButton
            id="workers-dropdown"
            bsSize="small"
            title={`Filter by: ${this.state.filter || 'None'}`}
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
        {this.state.error && <Error error={this.state.error} />}
        {this.state.loading && <Spinner />}
        <Table responsive condensed={true} hover={true}>
          <thead>
            <tr>
              <th>Worker ID</th>
              <th>Most Recent Task</th>
              <th>First Claim</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!this.state.loading && this.state.workers && (
              this.state.workers.workers.map(({ workerGroup, workerId, latestTask, firstClaim, disabled }, index) => (
                <tr key={`worker-${index}`}>
                  <td>
                    <Link
                      to={`/workers/provisioners/${this.props.provisionerId}/worker-types/${this.props.workerType}/workers/${workerGroup}/${workerId}`}>
                      {workerId}
                    </Link>
                  </td>
                  <td>{latestTask ? <Link to={`/tasks/${latestTask}`}>{latestTask}</Link> : '-'}
                  </td>
                  <td><DateView date={firstClaim} /></td>
                  <td>
                    <Label bsSize="sm" bsStyle={disabled ? 'danger' : 'success'}>{disabled ? 'disabled' : 'enabled'}</Label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        {this.state.workers && !this.state.workers.workers.length && !this.state.loading && (
          <div>{`There are no ${this.state.filter} workers in this worker-type`}</div>
        )}
        <div className={styles.pagination}>
          {this.state.workerToken && (
            <Button bsStyle="default" onClick={this.clearWorkerToken} className="pull-left">
              <Glyphicon glyph="arrow-left" /> Back to start
            </Button>
          )}
          {this.state.workers && this.state.workers.continuationToken ?
            (
              <Button bsStyle="default" onClick={this.nextWorkers} className="pull-right">
                More workers <Glyphicon glyph="arrow-right" />
              </Button>
            ) :
            null
          }
        </div>
      </div>
    );
  }
}
