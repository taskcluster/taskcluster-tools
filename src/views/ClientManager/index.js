import React from 'react';
import Clients from '../../components/Clients';
import ClientManager from './ClientManager';

const View = ({ credentials, match, history }) => (
  <Clients credentials={credentials} Auth>
    {({ auth }) => (
      <ClientManager
        auth={auth}
        history={history}
        credentials={credentials}
        clientId={match.params.clientId ? decodeURIComponent(match.params.clientId) : ''} />
    )}
  </Clients>
);

export default View;
