import React from 'react';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import SecretsExpander from './SecretsExpander';

const View = () => (
  <WithUserSession>
    {userSession => (
      <WithClients Auth>
        {clients => <SecretsExpander {...clients} userSession={userSession} />}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
