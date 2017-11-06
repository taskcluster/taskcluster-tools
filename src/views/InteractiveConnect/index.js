import React from 'react';
import Clients from '../../components/Clients';
import InteractiveConnect from './InteractiveConnect';

const View = ({ userSession, match }) => (
  <Clients userSession={userSession} Queue QueueEvents>
    {clients => (
      <InteractiveConnect
        userSession={userSession}
        {...clients}
        taskId={match.params.taskId || ''}
      />
    )}
  </Clients>
);

export default View;
