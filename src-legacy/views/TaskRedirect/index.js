import React from 'react';
import Clients from '../../components/Clients';
import TaskRedirect from './TaskRedirect';

const View = ({ userSession, match, location }) => (
  <Clients userSession={userSession} Queue>
    {({ queue }) => (
      <TaskRedirect
        queue={queue}
        taskId={match.params.taskId}
        action={match.params.action}
        interactive={location.state && location.state.interactive}
      />
    )}
  </Clients>
);

export default View;
