import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import TaskCreator from './TaskCreator';

const View = ({ history, location, interactive }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Queue>
        {clients => (
          <TaskCreator
            {...clients}
            history={history}
            location={location}
            interactive={interactive}
            userSession={userSession}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
