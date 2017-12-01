import React from 'react';
import Clients from '../../components/Clients';
import TaskCreator from './TaskCreator';

const View = ({ userSession, history, location, interactive }) => (
  <Clients userSession={userSession} Queue>
    {({ queue }) => (
      <TaskCreator
        queue={queue}
        history={history}
        location={location}
        interactive={interactive}
        userSession={userSession}
      />
    )}
  </Clients>
);

export default View;
