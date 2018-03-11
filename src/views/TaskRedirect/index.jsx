import WithClients from '../../components/WithClients';
import TaskRedirect from './TaskRedirect';

const View = ({ match, location }) => (
  <WithClients Queue>
    {clients => (
      <TaskRedirect
        {...clients}
        taskId={match.params.taskId}
        action={match.params.action}
        interactive={location.state && location.state.interactive}
      />
    )}
  </WithClients>
);

export default View;
