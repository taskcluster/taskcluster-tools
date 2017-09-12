import React from 'react';
import Clients from '../../components/Clients';
import WorkerManager from './WorkerManager';

const View = ({ credentials, history, match }) => (
  <Clients credentials={credentials} Queue>
    {clients => (
      <WorkerManager
        {...clients}
        history={history}
        provisionerId={match.params.provisionerId ? match.params.provisionerId : ''}
        workerType={match.params.workerType ? match.params.workerType : ''}
        workerGroup={match.params.workerGroup ? match.params.workerGroup : ''}
        workerId={match.params.workerId ? match.params.workerId : ''} />
    )}
  </Clients>
);

export default View;
