import React from 'react';
import Clients from '../../components/Clients';
import IndexBrowser from '../../components/IndexBrowser';
import EntryView from './EntryView';

const View = ({ match, credentials, history }) => (
  <Clients credentials={credentials} Index>
    {({ index }) => {
      const { namespace = '', namespaceTaskId } = match.params;

      return (
        <IndexBrowser
          urlRoot="/index"
          history={history}
          index={index}
          namespace={namespace}
          namespaceTaskId={namespaceTaskId}>
          <EntryView index={index} namespace={namespace} namespaceTaskId={namespaceTaskId} />
        </IndexBrowser>
      );
    }}
  </Clients>
);

export default View;
