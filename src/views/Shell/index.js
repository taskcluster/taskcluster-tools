import React from 'react';
import Shell from './Shell';

const View = ({ location }) => {
  const search = new URLSearchParams(location.search);
  const props = ['socketUrl', 'v', 'taskId']
    .reduce((props, key) => ({ ...props, [key]: decodeURIComponent(search.get(key)) }), {});

  return <Shell {...props} />;
};

export default View;
