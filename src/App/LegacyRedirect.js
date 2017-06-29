import React from 'react';
import { Redirect } from 'react-router-dom';

const LegacyRedirect = (props) => {
  if (props.path === '/task-group-inspector' || props.path === '/push-inspector') {
    const parts = props.location.hash.split('/');

    if (!parts.length) {
      return <Redirect to={'/groups'} />;
    }

    if (parts.length === 1) {
      return <Redirect to={`/groups/${parts[0]}`} />;
    }

    return <Redirect to={`/groups/${parts[0]}/tasks/${parts[1]}`} />;
  } else if (props.path === '/task-inspector') {
    return <Redirect to={`/tasks/${props.location.hash.slice(1)}`} />;
  } else if (props.path === '/one-click-loaner') {
    return props.location.hash ?
      <Redirect to={`/tasks/${props.location.hash.slice(1)}/create/`} /> :
      <Redirect to="/groups" />;
  }
};

export default LegacyRedirect;
