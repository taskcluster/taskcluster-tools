import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import AwsProvisionerHealth from './AwsProvisionerHealth';

const View = () => (
  <WithUserSession>
    {() => (
      <WithClients EC2Manager>
        {clients => <AwsProvisionerHealth {...clients} />}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
