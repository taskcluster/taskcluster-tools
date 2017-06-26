import React from 'react';
import Clients from '../../components/Clients';
import HooksManager from './HooksManager';

const View = ({ credentials, match, history }) => (
  <Clients credentials={credentials} Hooks>
    {({ hooks }) => (
      <HooksManager
        history={history}
        hooks={hooks}
        hookGroupId={match.params.hookGroupId}
        hookId={match.params.hookId} />
    )}
  </Clients>
);

export default View;
