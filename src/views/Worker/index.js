import React from 'react';
import Clients from '../../components/Clients';
import WorkerManager from './WorkerManager';

const View = ({ credentials, history, match }) => (
  <Clients credentials={credentials} Queue>
    {clients => (
      <WorkerManager
        {...clients}
        history={history}
        provisionerId={match.params.provisionerId ? decodeURIComponent(match.params.provisionerId) : ''}
        workerType={match.params.workerType ? decodeURIComponent(match.params.workerType) : ''}
        workerGroup={match.params.workerGroup ? decodeURIComponent(match.params.workerGroup) : ''}
        workerId={match.params.workerId ? decodeURIComponent(match.params.workerId) : ''} />
    )}
  </Clients>
);

export default View;
