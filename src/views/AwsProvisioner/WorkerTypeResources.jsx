import { PureComponent } from 'react';
import { object, shape, arrayOf } from 'prop-types';
import { Table, Button } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { request } from 'taskcluster-client-web';
import { tail } from 'ramda';
import DateView from '../../components/DateView';
import Snackbar from '../../components/Snackbar';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner/index';
import styles from './styles.module.css';

const awsUrl = 'https://console.aws.amazon.com/ec2/v2/home';

export default class WorkerTypeResources extends PureComponent {
  static propTypes = {
    workerType: object.isRequired,
    awsState: shape({
      instances: arrayOf(object),
      requests: arrayOf(object)
    }).isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      actionLoading: false,
      toasts: [],
      error: null
    };
  }

  handleToastDismiss = () => this.setState({ toasts: tail(this.state.toasts) });

  getCapacityFor(stateKey, instanceState) {
    const { instanceTypes } = this.props.workerType;

    return this.props.awsState[stateKey].reduce((sum, instance) => {
      if (instanceState && instance.state !== instanceState) {
        return sum;
      }

      const type = instanceTypes.find(
        ({ instanceType }) => instanceType === instance.type
      );

      if (!type) {
        return sum;
      }

      return sum + instance.capacity;
    }, 0);
  }

  runningCapacity() {
    return this.getCapacityFor('instances', 'running');
  }

  pendingCapacity() {
    return this.getCapacityFor('instances', 'pending');
  }

  async terminateInstance(instanceId, region) {
    this.setState({ actionLoading: true }, async () => {
      const credentials = await this.props.userSession.getCredentials();

      try {
        await request(
          `${this.props.ec2BaseUrl}/region/${region}/instance/${instanceId}`,
          {
            extra: this.props.queue.buildExtraData(credentials),
            method: 'DELETE',
            credentials
          }
        );

        const toast = {
          text: 'Terminate',
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
  }

  handleTerminateAllInstances = () => {
    const { workerType } = this.props.workerType;

    this.setState({ actionLoading: true }, async () => {
      const credentials = await this.props.userSession.getCredentials();

      try {
        await request(
          `${this.props.ec2BaseUrl}/worker-types/${workerType}/resources`,
          {
            extra: this.props.queue.buildExtraData(credentials),
            method: 'DELETE',
            credentials
          }
        );

        const toast = {
          text: 'Terminate All',
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

  renderInstanceRow = (instance, index) => (
    <tr key={index}>
      <td>{this.renderInstanceIdLink(instance.id, instance.region)}</td>
      <td>
        <code>{instance.type}</code>
      </td>
      <td>
        <code>{instance.zone}</code>
      </td>
      <td>{this.renderImageIdLink(instance.ami, instance.region)}</td>
      <td>
        <DateView date={new Date(instance.launch)} />
      </td>
      <td>
        <Button
          bsStyle="danger"
          bsSize="small"
          disabled={this.state.actionLoading}
          onClick={() => this.terminateInstance(instance.id, instance.region)}>
          Terminate
        </Button>
      </td>
    </tr>
  );

  renderInstanceIdLink(instanceId, region) {
    const qs = `?region=${region}#Instances:instanceId=${instanceId};sort=Name`;

    return (
      <a href={`${awsUrl}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{instanceId}</code>
        <i className="fa fa-external-link" style={{ paddingLeft: 5 }} />
      </a>
    );
  }

  renderImageIdLink(imageId, region) {
    const qs = `?region=${region}#Images:visibility=owned-by-me;imageId=${imageId};sort=name`;

    return (
      <a href={`${awsUrl}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{imageId}</code>
        <Icon name="external-link" style={{ paddingLeft: 5 }} />
      </a>
    );
  }

  render() {
    return (
      <span>
        <Snackbar
          toasts={this.state.toasts}
          onDismiss={this.handleToastDismiss}
        />
        <h3>Running Instances</h3>
        We have a total running instance capacity of {this.runningCapacity()}.
        These are instances that the provisioner counts as doing work.
        <div className={styles.actions}>
          <label>Actions</label>
          <Button
            bsStyle="danger"
            bsSize="small"
            disabled={this.state.actionLoading}
            onClick={this.handleTerminateAllInstances}>
            Terminate All Instances
          </Button>
        </div>
        {this.state.actionLoading && <Spinner />}
        {this.state.error && <Error error={this.state.error} />}
        <Table>
          <thead>
            <tr>
              <th>Instance Id</th>
              <th>Instance Type</th>
              <th>Availability Zone</th>
              <th>AMI</th>
              <th>Launch Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {this.props.awsState.instances
              .filter(x => x.state === 'running')
              .map(this.renderInstanceRow)}
          </tbody>
        </Table>
        <h3>Pending Instances</h3>
        We have a total pending instance capacity of {this.pendingCapacity()}.
        These are filled spot requests which are not yet doing work. These are
        usually instances which are booting up.
        <Table>
          <thead>
            <tr>
              <th>Instance Id</th>
              <th>Instance Type</th>
              <th>Availability Zone</th>
              <th>Image Id</th>
              <th>Launch Time</th>
            </tr>
          </thead>
          <tbody>
            {this.props.awsState.instances
              .filter(x => x.state === 'pending')
              .map(this.renderInstanceRow)}
          </tbody>
        </Table>
      </span>
    );
  }
}
