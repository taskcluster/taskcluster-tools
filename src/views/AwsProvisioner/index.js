import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import WorkerTypeTable from './WorkerTypeTable';

const View = ({ credentials, match, history, location }) => {
  const [worker, tab] = location.hash.slice(1).split('/');

  if (worker && tab) {
    return <Redirect to={`/aws-provisioner/${worker}/${tab}`} />;
  } else if (worker) {
    return <Redirect to={`/aws-provisioner/${worker}`} />;
  }

  return (
    <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
      {clients => (
        <WorkerTypeTable
          {...clients}
          history={history}
          credentials={credentials}
          provisionerId="aws-provisioner-v1"
          workerType={match.params.workerType}
          currentTab={match.params.currentTab} />
      )}
    </Clients>
  );
};

export default View;
