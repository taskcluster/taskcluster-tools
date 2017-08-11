import React from 'react';
import Clients from '../../components/Clients';
import CachePurgeInspector from './CachePurgeInspector';

const View = ({ credentials }) => (
  <Clients credentials={credentials} PurgeCache>
    {({ purgeCache }) => (
      <CachePurgeInspector purgeCache={purgeCache} credentials={credentials} />
    )}
  </Clients>
);

export default View;
