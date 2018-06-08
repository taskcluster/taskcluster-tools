import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import AwsProvisionerErrors from './AwsProvisionerErrors';

const View = ({ provisionerId }) => (
  <WithUserSession>
    {() => (
      <WithClients EC2Manager>
        {clients => (
          <AwsProvisionerErrors {...clients} provisionerId={provisionerId} />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
