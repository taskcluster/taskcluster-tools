import { PureComponent } from 'react';
import Spinner from '../../components/Spinner';
import Error from '../../components/Error';
import AwsProvisionerHealthTable from '../../components/AwsProvisionerHealthTable';

export default class AwsProvisionerHealth extends PureComponent {
  state = {
    loading: true,
    error: null,
    healthData: null
  };

  componentWillMount() {
    this.loadHealth();
  }

  async loadHealth() {
    try {
      this.setState({
        healthData: await this.props.ec2Manager.getHealth(),
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        healthData: null,
        loading: false,
        error
      });
    }
  }

  render() {
    const { loading, error, healthData } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    if (!healthData || !healthData.requestHealth.length) {
      return <div>Health stats not available</div>;
    }

    return (
      <div>
        <h4>Provisioner Health</h4>
        <AwsProvisionerHealthTable healthData={healthData} />
      </div>
    );
  }
}
