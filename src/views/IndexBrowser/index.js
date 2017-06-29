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
    <Clients credentials={credentials} Index>
      {({ index }) => (
        <div>
          <HelmetTitle title="Index Browser" />
          <IndexBrowser
            urlRoot="/index"
            history={history}
            index={index}
            namespace={namespace}
            namespaceTaskId={namespaceTaskId}>
            <EntryView index={index} namespace={namespace} namespaceTaskId={namespaceTaskId} />
          </IndexBrowser>
        </div>
      )}
    </Clients>
  );
};

export default View;
