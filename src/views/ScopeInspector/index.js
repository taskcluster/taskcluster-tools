import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import ScopeInspector from './ScopeInspector';

const View = ({ credentials, match, history }) => {
  const [scope, entity] = location.hash.slice(1).split('/');

  if (scope && entity) {
    return <Redirect to={`/auth/scopes/${scope}/${entity}`} />;
  } else if (scope) {
    return <Redirect to={`/auth/scopes/${scope}`} />;
  }

  const selectedScope = decodeURIComponent(match.params.selectedScope || '');
  const selectedEntity = decodeURIComponent(match.params.selectedEntity || '');

  return (
    <Clients credentials={credentials} Auth>
      {({ auth }) => (
        <ScopeInspector
          auth={auth}
          history={history}
          credentials={credentials}
          selectedScope={selectedScope}
          selectedEntity={selectedEntity} />
      )}
    </Clients>
  );
};

export default View;
