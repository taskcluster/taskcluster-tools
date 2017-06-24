import React from 'react';
import Clients from '../../components/Clients';
import WorkerTypeTable from './WorkerTypeTable';

export default ({ credentials, match, history, location }) => (
  <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
    {clients => (
      <WorkerTypeTable
        {...clients}
        history={history}
        provisionerId="aws-provisioner-v1"
        workerType={match.params.workerType}
        currentTab={match.params.currentTab} />
    )}
  </Clients>
);
