import { PureComponent } from 'react';
import { string, object } from 'prop-types';
import Icon from 'react-fontawesome';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import AwsProvisionerErrorTable from '../../components/AwsProvisionerErrorTable';
import AwsProvisionerHealthTable from '../../components/AwsProvisionerHealthTable';
import { workerTypeHealthItem } from './styles.module.css';

export default class WorkerTypeHealth extends PureComponent {
  static propTypes = {
    workerType: string.isRequired,
    ec2Manager: object.isRequired
  };

  state = {
    loading: true,
    error: null,
    workerTypeErrors: null,
    workerTypeHealth: null
  };

  componentWillMount() {
    this.loadHealth();
  }

  componentWillReceiveProps({ workerType }) {
    if (this.props.workerType !== workerType) {
      this.setState(
        {
          workerTypeErrors: [],
          workerTypeHealth: {}
        },
        this.loadHealth
      );
    }
  }

  async loadHealth() {
    const { ec2Manager, workerType } = this.props;

    this.setState({ loading: true });

    try {
      const [errors, health] = await Promise.all([
        ec2Manager.workerTypeErrors(workerType).then(({ errors }) => errors),
        ec2Manager.workerTypeHealth(workerType)
      ]);

      this.setState({
        workerTypeErrors: errors,
        workerTypeHealth: health,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        workerTypeErrors: null,
        workerTypeHealth: null,
        loading: false,
        error
      });
    }
  }

  render() {
    const { loading, error, workerTypeErrors, workerTypeHealth } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    return (
      <div>
        <h5>
          <Icon name="exclamation-triangle" /> <strong>Errors</strong>
        </h5>
        <div className={workerTypeHealthItem}>
          <AwsProvisionerErrorTable errorData={workerTypeErrors} />
        </div>
        <h5>
          <Icon name="heartbeat" /> <strong>Health</strong>
        </h5>
        <div className={workerTypeHealthItem}>
          <AwsProvisionerHealthTable healthData={workerTypeHealth} />
        </div>
      </div>
    );
  }
}
