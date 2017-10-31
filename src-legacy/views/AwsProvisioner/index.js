import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import WorkerTypeTable from './WorkerTypeTable';

const View = ({
  userSession,
  match,
  history,
  location,
  baseUrl,
  provisionerId,
  routeRoot
}) => {
  const [worker, tab] = location.hash.slice(1).split('/');

  if (worker && tab) {
    return <Redirect to={`${routeRoot}/${worker}/${tab}`} />;
  } else if (worker) {
    return <Redirect to={`${routeRoot}/${worker}`} />;
  }

  return (
    <Clients userSession={userSession} Queue AwsProvisioner={{ baseUrl }}>
      {clients => (
        <WorkerTypeTable
          {...clients}
          history={history}
          userSession={userSession}
          routeRoot={routeRoot}
          provisionerId={provisionerId}
          workerType={match.params.workerType}
          currentTab={match.params.currentTab}
        />
      )}
    </Clients>
  );
};

export default View;
