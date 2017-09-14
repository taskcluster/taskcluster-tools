import React from 'react';
import Clients from '../../components/Clients';
import WorkerManager from './WorkerManager';

const View = ({ credentials, history, match, location }) => (
  <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://aws-provisioner.taskcluster.net/v1' }}>
    {clients => (
      <WorkerManager
        {...clients}
        history={history}
        location={location}
        provisionerId={match.params.provisionerId ? match.params.provisionerId : ''} />
    )}
  </Clients>
);

export default View;
