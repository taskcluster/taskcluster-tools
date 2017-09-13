import React from 'react';
import Clients from '../../components/Clients';
import SecretsManager from './SecretsManager';

const View = ({ userSession, history, match }) => (
  <Clients userSession={userSession} Secrets>
    {({ secrets }) => (
      <SecretsManager
        history={history}
        userSession={userSession}
        secrets={secrets}
        secretId={match.params.secretId ? decodeURIComponent(match.params.secretId) : ''} />
    )}
  </Clients>
);

export default View;
