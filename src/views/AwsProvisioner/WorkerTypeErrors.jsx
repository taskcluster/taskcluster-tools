import { PureComponent } from 'react';
import { string, object } from 'prop-types';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import AwsProvisionerErrorTable from '../../components/AwsProvisionerErrorTable';

export default class WorkerTypeErrors extends PureComponent {
  static propTypes = {
    workerType: string.isRequired,
    ec2Manager: object.isRequired
  };

  state = {
    loading: true,
    error: null,
    workerTypeErrors: null
  };

  componentWillMount() {
    this.loadErrors();
  }

  componentWillReceiveProps({ workerType }) {
    if (this.props.workerType !== workerType) {
      this.setState(
        {
          workerTypeErrors: []
        },
        this.loadErrors
      );
    }
  }

  async loadErrors() {
    const { ec2Manager, workerType } = this.props;

    this.setState({ loading: true });

    try {
      const { errors } = await ec2Manager.workerTypeErrors(workerType);

      this.setState({
        workerTypeErrors: errors,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        workerTypeErrors: null,
        loading: false,
        error
      });
    }
  }

  render() {
    const { loading, error, workerTypeErrors } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    return <AwsProvisionerErrorTable errorData={workerTypeErrors} />;
  }
}
