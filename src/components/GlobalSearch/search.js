import React from 'react';
import { FontIcon } from 'react-md';

const isSlug = slug =>
  /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/i.test(
    slug
  );
const makeLink = (primaryText, url, icon = 'exit_to_app') => ({
  primaryText,
  url,
  leftIcon: <FontIcon>{icon}</FontIcon>
});
const search = term => {
  const data = [
    makeLink('Aws Provisioner', '/aws-provisioner'),
    makeLink('Client Creator', '/auth/clients/new'),
    makeLink('Client Manager', '/auth/clients'),
    makeLink('Credentials Manager', '/credentials'),
    makeLink('Diagnostics', '/diagnostics'),
    makeLink('Displays', '/display'),
    makeLink('Hooks Manager', '/hooks'),
    makeLink('Indexed Artifacts', '/index/artifacts'),
    makeLink('Indexed Tasks', '/index'),
    makeLink('Provisioners Explorer', '/provisioners'),
    makeLink('Pulse Inspector', '/pulse-inspector'),
    makeLink('Purge Caches', '/purge-caches'),
    makeLink('Quick Start', '/quickstart'),
    makeLink('Role Manager', '/auth/roles'),
    makeLink('Scope Inspector', '/auth/scopes'),
    makeLink('Scope Grants', '/auth/grants'),
    makeLink('Secrets Manager', '/secrets'),
    makeLink('Task Creator', '/tasks/create'),
    makeLink('Unified Inspector', '/groups'),
    () =>
      isSlug(term)
        ? makeLink(`Group Inspector: ${term}`, `/groups/${term}`, 'search')
        : null,
    () =>
      isSlug(term)
        ? makeLink(`Task Inspector: ${term}`, `/tasks/${term}`, 'search')
        : null,
    () =>
      isSlug(term)
        ? makeLink(
            `Interactive Connect with Task: ${term}`,
            `/tasks/${term}/connect`,
            'search'
          )
        : null,
    () =>
      isSlug(term)
        ? makeLink(
            `Shell with Task ${term}`,
            `/tasks/${term}/connect`,
            'search'
          )
        : null
  ];

  return data
    .map(datum => (typeof datum === 'function' ? datum() : datum))
    .filter(datum => datum && datum.primaryText.match(new RegExp(term, 'i')));
};

export default search;
