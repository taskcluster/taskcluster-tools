import React from 'react';
import Clients from '../../components/Clients';
import HooksManager from './HooksManager';

const View = ({ credentials, match, history, location }) => {
  const [groupId, id] = location.hash.slice(1).split('/');
  const hookGroupId = match.params.hookGroupId || groupId;
  const hookId = match.params.hookId || id;

  return (
    <Clients credentials={credentials} Hooks>
      {({ hooks }) => (
        <HooksManager
          history={history}
          hooks={hooks}
          hookGroupId={hookGroupId}
          hookId={hookId} />
      )}
    </Clients>
  );
};

export default View;
