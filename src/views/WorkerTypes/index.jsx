import WithClients from '../../components/WithClients';
import WorkerManager from './WorkerManager';

const View = ({ history, match, location }) => (
  <WithClients
    Queue
    AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
    {clients => (
      <WorkerManager
        {...clients}
        history={history}
        location={location}
        provisionerId={
          match.params.provisionerId ? match.params.provisionerId : ''
        }
      />
    )}
  </WithClients>
);

export default View;
