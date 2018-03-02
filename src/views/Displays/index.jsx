import WithUserSession from '../../components/WithUserSession';
import DisplayList from './DisplayList';
import HelmetTitle from '../../components/HelmetTitle';

const View = ({ location }) => {
  const search = new URLSearchParams(location.search);
  const props = [
    'displaysUrl',
    'socketUrl',
    'v',
    'shared',
    'taskId',
    'runId'
  ].reduce(
    (props, key) => ({ ...props, [key]: decodeURIComponent(search.get(key)) }),
    {}
  );

  return (
    <div>
      <HelmetTitle title="Display" />
      <WithUserSession>
        {userSession => <DisplayList userSession={userSession} {...props} />}
      </WithUserSession>
    </div>
  );
};

export default View;
