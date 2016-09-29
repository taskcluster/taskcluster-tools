import createDebugger from 'debug';
import url from 'url';

const debug = createDebugger('tools:lib:credentials');

/** Save credentials from localStorage (removed them if null is given) */
export const saveCredentials = credentials => {
  if (!credentials) {
    // delete credentials
    delete localStorage.credentials;
  } else {
    // Store credentials as JSON
    localStorage.credentials = JSON.stringify(credentials);
  }

  // Notify interested parties that credentials have changed
  window.dispatchEvent(new window.CustomEvent('credentials-changed', {
    detail: credentials
  }));
};

/** Load credentials from localStorage */
let credentialsExpiredTimeout = null;

export const loadCredentials = () => {
  // We have no credentials
  if (!localStorage.credentials) {
    return;
  }

  // Attempt to parse credentials if they are present, and delete them if
  // they have expired
  try {
    const creds = JSON.parse(localStorage.credentials);

    if (creds.certificate && creds.certificate.expiry < Date.now()) {
      saveCredentials(null); // clear credentials
    } else if (creds.certificate) {
      clearTimeout(credentialsExpiredTimeout);

      credentialsExpiredTimeout = setTimeout(() => saveCredentials(null),
        creds.certificate.expiry - Date.now());
    } else {
      clearTimeout(credentialsExpiredTimeout);
      credentialsExpiredTimeout = null;
    }

    return creds;
  } catch (err) {
    debug('Failed to parse credentials, err: %s', err, err.stack);
  }
};

/** Check if we have credentials */
export const hasCredentials = () => {
  const credentials = loadCredentials();
  return credentials != null;
};

// Listen for storage events to the credentials property
window.addEventListener('storage', e => {
  if (e.storageArea === localStorage && e.key === 'credentials') {
    // Find the new credentials from the event
    let credentials = e.newValue;

    if (credentials) {
      try {
        credentials = JSON.parse(credentials);
      } catch (err) {
        debug('Failed to parse credentials, err: %s', err, err.stack);
        credentials = undefined;
      }
    }

    // Notify interested parties that credentials have changed
    window.dispatchEvent(new window.CustomEvent('credentials-changed', {
      detail: credentials
    }));
  }
}, false);

/** Build URL to login at auth.taskcluster.net */
export const buildLoginURL = () => {
  const target = url.format({
    protocol: window.location.protocol,
    host: window.location.host,
    pathname: '/login/'
  });

  return url.format({
    protocol: 'https',
    host: 'login.taskcluster.net',
    query: {
      target,
      description: `TaskCluster Tools offers various way to create and inspect both tasks,
        and task-graphs.`
    }
  });
};
