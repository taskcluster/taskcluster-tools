import React from 'react';
import Clients from '../../components/Clients';
import CachePurgeInspector from './CachePurgeInspector';

const View = props => (
  <Clients credentials={props.credentials} PurgeCache>
    {({ purgeCache }) => (
      <CachePurgeInspector purgeCache={purgeCache} />
    )}
  </Clients>
);

export default View;
