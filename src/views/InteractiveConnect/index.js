import React from 'react';
import Clients from '../../components/Clients';
import InteractiveConnect from './InteractiveConnect';

const View = ({ credentials, match }) => (
  <Clients credentials={credentials} Queue QueueEvents>
    {clients => (
      <InteractiveConnect credentials={credentials} {...clients} taskId={match.params.taskId || ''} />
    )}
  </Clients>
);

export default View;
