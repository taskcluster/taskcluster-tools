import WithUserSession from '../../components/WithUserSession';
import WithClients from '../../components/WithClients';
import Provisioners from './Provisioners';

const View = ({ match }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Queue>
        {clients => (
          <Provisioners
            {...clients}
            userSession={userSession}
            provisionerId={match.params.provisionerId || ''}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
