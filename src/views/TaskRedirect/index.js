import React from 'react';
import Clients from '../../components/Clients';
import TaskRedirect from './TaskRedirect';

const View = ({ credentials, match }) => (
  <Clients credentials={credentials} Queue>
    {({ queue }) => (
      <TaskRedirect queue={queue} taskId={match.params.taskId} action={match.params.action} />
    )}
  </Clients>
);

export default View;
