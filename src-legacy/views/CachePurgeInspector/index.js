import React from 'react';
import Clients from '../../components/Clients';
import CachePurgeInspector from './CachePurgeInspector';

const View = ({ userSession }) => (
  <Clients userSession={userSession} PurgeCache>
    {({ purgeCache }) => (
      <CachePurgeInspector purgeCache={purgeCache} userSession={userSession} />
    )}
  </Clients>
);

export default View;
