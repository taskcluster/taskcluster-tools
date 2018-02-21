import React from 'react';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import SecretsInspector from './SecretsInspector';

const View = ({ history, match }) => {
  const selectedSecret = decodeURIComponent(match.params.selectedSecret || '');

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Secrets>
          {clients => (
            <SecretsInspector
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
