import React from 'react';
import Clients from '../../components/Clients';
import ScopeInspector from './ScopeInspector';

const View = ({ credentials, match, history }) => (
  <Clients credentials={credentials} Auth>
    {({ auth }) => (
      <ScopeInspector
        auth={auth}
        history={history}
        selectedScope={match.params.selectedScope ? decodeURIComponent(match.params.selectedScope) : ''}
        selectedEntity={match.params.selectedEntity ? decodeURIComponent(match.params.selectedEntity) : ''} />
    )}
  </Clients>
);

export default View;
