import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import WorkerManager from './WorkerManager';

const View = ({ history, match, location }) => (
  <WithUserSession>
    {userSession => (
      <WithClients
        Queue
        AwsProvisioner={{
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
        }}>
        {clients => (
          <WorkerManager
            {...clients}
            history={history}
            location={location}
            provisionerId={
              match.params.provisionerId ? match.params.provisionerId : ''
            }
            workerType={match.params.workerType ? match.params.workerType : ''}
            userSession={userSession}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
