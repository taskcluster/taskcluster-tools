import React from 'react';
import Clients from '../../components/Clients';
import WorkerTypeTable from './WorkerTypeTable';

const View = ({ credentials, match, history, location }) => {
  const [worker, tab] = location.hash.slice(1).split('/');
  const workerType = match.params.workerType || worker;
  const currentTab = match.params.currentTab || tab;

  return (
    <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
      {clients => (
        <WorkerTypeTable
          {...clients}
          history={history}
          provisionerId="aws-provisioner-v1"
          workerType={workerType}
          currentTab={currentTab} />
      )}
    </Clients>
  );
};

export default View;
