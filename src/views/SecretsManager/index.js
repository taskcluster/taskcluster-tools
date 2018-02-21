import React from 'react';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import SecretsManager from './SecretsManager';

const View = ({ history, match }) => {
  const selectedSecret = decodeURIComponent(match.params.selectedSecret || '');

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Secrets>
          {clients => (
            <SecretsManager
              history={history}
              {...clients}
              userSession={userSession}
              secretId={
                match.params.secretId
                  ? decodeURIComponent(match.params.secretId)
                  : ''
              }
              selectedSecret={selectedSecret}
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
