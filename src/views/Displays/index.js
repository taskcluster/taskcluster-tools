import React from 'react';
import DisplayList from './DisplayList';

const View = ({ location }) => {
  const search = new URLSearchParams(location.search);
  const props = ['displaysUrl', 'socketUrl', 'v', 'shared', 'taskId', 'runId']
    .reduce((props, key) => ({ ...props, [key]: decodeURIComponent(search.get(key)) }), {});

  return <DisplayList {...props} />;
};

export default View;
