import { Redirect } from 'react-router-dom';
import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import WorkerTypeTable from './WorkerTypeTable';

const View = ({ match, history, location, provisionerId, routeRoot }) => {
  const [worker, tab] = location.hash.slice(1).split('/');

  if (worker && tab) {
    return <Redirect to={`${routeRoot}/${worker}/${tab}`} />;
  } else if (worker) {
    return <Redirect to={`${routeRoot}/${worker}`} />;
  }

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Queue AwsProvisioner EC2Manager>
          {clients => (
            <WorkerTypeTable
              {...clients}
              userSession={userSession}
              history={history}
              routeRoot={routeRoot}
              provisionerId={provisionerId}
              workerType={match.params.workerType}
              currentTab={match.params.currentTab}
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
