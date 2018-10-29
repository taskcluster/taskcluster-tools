import { PureComponent } from 'react';
import Spinner from '../../components/Spinner';
import Error from '../../components/Error';
import AwsProvisionerErrorTable from '../../components/AwsProvisionerErrorTable';

export default class AwsProvisionerErrors extends PureComponent {
  state = {
    loading: true,
    error: null,
    recentErrors: null
  };

  componentWillMount() {
    this.loadRecentErrors();
  }

  async loadRecentErrors() {
    try {
      this.setState({
        recentErrors: (await this.props.ec2Manager.getRecentErrors()).errors,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        recentErrors: null,
        loading: false,
        error
      });
    }
  }

  render() {
    const { loading, error, recentErrors } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    if (!recentErrors || !recentErrors.length) {
      return (
        <div>
          No recent errors in <code>{this.props.provisionerId}</code>
        </div>
      );
    }

    return (
      <div>
        <h4>Recent Provisioning Errors</h4>
        <AwsProvisionerErrorTable errorData={recentErrors} />
      </div>
    );
  }
}
