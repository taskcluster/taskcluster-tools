import React from 'react';
import { Redirect } from 'react-router-dom';

const LegacyRedirect = (props) => {
  if (props.path === '/task-inspector') {
    return <Redirect to={`/tasks/${props.location.hash.slice(1)}`} />;
  } else if (props.path === '/one-click-loaner') {
    return props.location.hash ?
      <Redirect to={`/tasks/${props.location.hash.slice(1)}/create/`} /> :
      <Redirect to="/groups" />;
  }
};

export default LegacyRedirect;
