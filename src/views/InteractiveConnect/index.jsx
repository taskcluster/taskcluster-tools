import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import InteractiveConnect from './InteractiveConnect';

const View = ({ match }) => (
  <WithUserSession>
    {userSession => (
      <WithClients Queue QueueEvents>
        {clients => (
          <InteractiveConnect
            {...clients}
            userSession={userSession}
            taskId={match.params.taskId || ''}
          />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
