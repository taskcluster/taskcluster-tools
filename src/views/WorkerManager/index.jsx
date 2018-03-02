import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import WorkerManager from './WorkerManager';

const View = ({ history, match }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Queue>
        {clients => (
          <WorkerManager
            {...clients}
            history={history}
            provisionerId={
              match.params.provisionerId ? match.params.provisionerId : ''
            }
            workerType={match.params.workerType ? match.params.workerType : ''}
            workerGroup={
              match.params.workerGroup ? match.params.workerGroup : ''
            }
            workerId={match.params.workerId ? match.params.workerId : ''}
            userSession={userSession}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
