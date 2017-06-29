import React from 'react';
import Clients from '../../components/Clients';
import ScopeInspector from './ScopeInspector';

const View = ({ credentials, match, history }) => {
  const [scope, entity] = location.hash.slice(1).split('/');
  const selectedScope = decodeURIComponent(match.params.selectedScope || scope || '');
  const selectedEntity = decodeURIComponent(match.params.selectedEntity || entity || '');

  return (
    <Clients credentials={credentials} Auth>
      {({ auth }) => (
        <ScopeInspector
          auth={auth}
          history={history}
          selectedScope={selectedScope}
          selectedEntity={selectedEntity} />
      )}
    </Clients>
  );
};

export default View;
