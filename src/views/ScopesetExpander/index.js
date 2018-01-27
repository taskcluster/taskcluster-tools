import React from 'react';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ScopesetExpander from './ScopesetExpander';

const View = ({ history }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Auth>
        {clients => (
          <ScopesetExpander
            {...clients}
            history={history}
            userSession={userSession}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
