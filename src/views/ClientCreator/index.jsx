import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ClientCreator from './ClientCreator';

const View = ({ location }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Auth>
        {clients => (
          <ClientCreator
            {...clients}
            userSession={userSession}
            location={location}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
