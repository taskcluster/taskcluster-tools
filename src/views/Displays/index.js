import React from 'react';
import DisplayList from './DisplayList';
import HelmetTitle from '../../components/HelmetTitle';

const View = ({ location, userSession }) => {
  const search = new URLSearchParams(location.search);
  const props = ['displaysUrl', 'socketUrl', 'v', 'shared', 'taskId', 'runId']
    .reduce((props, key) => ({ ...props, [key]: decodeURIComponent(search.get(key)) }), {});

  return (
    <div>
      <HelmetTitle title="Display" />
      <DisplayList userSession={userSession} {...props} />
    </div>
  );
};

export default View;
