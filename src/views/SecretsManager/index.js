import React from 'react';
import Clients from '../../components/Clients';
import SecretsManager from './SecretsManager';

const View = ({ credentials, history, match }) => (
  <Clients credentials={credentials} Secrets>
    {({ secrets }) => (
      <SecretsManager
        history={history}
        credentials={credentials}
        secrets={secrets}
        secretId={match.params.secretId ? decodeURIComponent(match.params.secretId) : ''} />
    )}
  </Clients>
);

export default View;
