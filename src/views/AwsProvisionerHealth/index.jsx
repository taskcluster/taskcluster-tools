import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import AwsProvisionerHealth from './AwsProvisionerHealth';

const View = ({ ec2BaseUrl }) => (
  <WithUserSession>
    {() => (
      <WithClients EC2Manager={{ baseUrl: ec2BaseUrl }}>
        {clients => (
          <AwsProvisionerHealth {...clients} ec2BaseUrl={ec2BaseUrl} />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
