import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import AwsProvisionerErrors from './AwsProvisionerErrors';

const View = ({ ec2BaseUrl, provisionerId }) => (
  <WithUserSession>
    {() => (
      <WithClients EC2Manager={{ baseUrl: ec2BaseUrl }}>
        {clients => (
          <AwsProvisionerErrors
            {...clients}
            provisionerId={provisionerId}
            ec2BaseUrl={ec2BaseUrl}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
