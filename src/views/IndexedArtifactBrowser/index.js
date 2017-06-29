import React from 'react';
import Clients from '../../components/Clients';
import IndexBrowser from '../../components/IndexBrowser';
import HelmetTitle from '../../components/HelmetTitle';
import EntryView from './EntryView';

const View = ({ match, credentials, history, location }) => {
  const [ns, nsId] = location.hash.slice(1).split('/');
  const namespace = match.params.namespace || ns || '';
  const namespaceTaskId = match.params.namespaceTaskId || nsId;

  return (
    <Clients credentials={credentials} Index Queue>
      {({ index, queue }) => (
        <div>
          <HelmetTitle title="Indexed Artifact Browser" />
          <IndexBrowser
            urlRoot="/index/artifacts"
            history={history}
            index={index}
            namespace={namespace}
            namespaceTaskId={namespaceTaskId}>
            <EntryView index={index} queue={queue} namespace={namespace} namespaceTaskId={namespaceTaskId} />
          </IndexBrowser>
        </div>
      )}
    </Clients>
  );
};

export default View;
