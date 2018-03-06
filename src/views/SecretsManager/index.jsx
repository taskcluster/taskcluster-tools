import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import SecretsManager from './SecretsManager';

const View = ({ history, match }) => (
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
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
