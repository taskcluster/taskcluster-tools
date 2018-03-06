import { Redirect } from 'react-router-dom';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import IndexBrowser from '../../components/IndexBrowser';
import HelmetTitle from '../../components/HelmetTitle';
import EntryView from './EntryView';

const View = ({ match, history, location }) => {
  const [ns, nsId] = location.hash.slice(1).split('/');

  if (ns && nsId) {
    return <Redirect to={`/index/${ns}/${nsId}`} />;
  } else if (ns) {
    return <Redirect to={`/index/${ns}`} />;
  }

  const { namespace = '', namespaceTaskId } = match.params;

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Index Queue>
          {clients => (
            <div>
              <HelmetTitle title="Index Browser" />
              <IndexBrowser
                {...clients}
                urlRoot="/index"
                history={history}
                userSession={userSession}
                namespace={namespace}
                namespaceTaskId={namespaceTaskId}>
                <EntryView
                  {...clients}
                  namespace={namespace}
                  namespaceTaskId={namespaceTaskId}
                  userSession={userSession}
                />
              </IndexBrowser>
            </div>
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
