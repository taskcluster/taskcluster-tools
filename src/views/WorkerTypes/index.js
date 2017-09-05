import React from 'react';
import Clients from '../../components/Clients';
import WorkerManager from './WorkerManager';

const View = ({ credentials, history, match }) => (
  <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
    {clients => (
      <WorkerManager
        {...clients}
        history={history}
        provisionerId={match.params.provisionerId ? decodeURIComponent(match.params.provisionerId) : ''} />
    )}
  </Clients>
);

export default View;
