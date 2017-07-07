import taskcluster from 'taskcluster-client';
import { omit } from 'ramda';
import merge from 'deepmerge';
import cloneDeep from 'lodash.clonedeep';
import Loadable from 'react-loadable';
import Loading from './components/Loading';

export const VALID_TASK = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

export const MIMETYPE_ICONS = {
  'file-pdf-o': ['application/pdf', 'application/postscript'],
  'file-archive-o': [
    'application/zip',
    'application/gzip',
    'application/x-tar',
    'application/x-gzip',
    'application/x-bzip2',
    'application/x-lzip',
    'application/x-lzma',
    'application/x-lzop',
    'application/x-xz',
    'application/x-compress',
    'application/x-apple-diskimage',
    'application/vnd.ms-cab-compressed',
    'application/vnd.android.package-archive',
    'application/x-gtar',
    /compressed/,
    /tar/,
    /zip/
  ],
  'file-word-o': ['text/rtf', 'text/html'],
  'file-excel-o': ['text/csv'],
  'file-powerpoint-o': [],
  'file-code-o': [
    'application/javascript',
    'application/json',
    'application/xml',
    'text/css',
    'text/javascript',
    'text/xml',
    'application/ecmascript'
  ],
  'file-video-o': [/^video\//],
  'file-image-o': [/^image\//],
  'file-text-o': [/^text\//],
  'file-audio-o': [/^audio\//],
  'file-o': [/.*/]
};

// Matching patterns for finding an icon from a mimetype, most specific
// mimetype are listed first as they are matched top down.
export const getIconFromMime = (contentType) => {
  const [icon = 'file-o'] = Object
    .entries(MIMETYPE_ICONS)
    .find(([, matches]) => matches
      .some(pattern => (pattern instanceof RegExp ?
        pattern.test(contentType) :
        pattern === contentType)));

  return icon;
};

export const getLoginUrl = (location = window.location) => {
  const query = new URLSearchParams();

  query.set('target', new URL('/login', location));
  query.set('description', 'Taskcluster Tools offers various way to create and inspect both tasks and task groups.');

  return `https://login.taskcluster.net/?${query.toString()}`;
};

// Transform task to a loaner task
export const parameterizeTask = task => merge(omit([
  'taskGroupId',
  // 'schedulerId',
  'routes',
  'dependencies',
  'requires',
  'scopes',
  'payload'
], cloneDeep(task)), {
  retries: 0,
  deadline: taskcluster.fromNowJSON('12 hours'),
  created: taskcluster.fromNowJSON(),
  expires: taskcluster.fromNowJSON('7 days'),
  scopes: task.scopes.filter(scope => !/^docker-worker:cache:/.test(scope)), // Delete cache scopes
  payload: merge(omit(['artifacts', 'cache'], task.payload || {}), {
    maxRunTime: Math.max(task.payload && task.payload.maxRunTime, 3 * 60 * 60),
    features: {
      interactive: true
    },
    env: {
      TASKCLUSTER_INTERACTIVE: 'true'
    }
  })
});

export const labels = {
  running: 'primary',
  pending: 'info',
  unscheduled: 'default',
  completed: 'success',
  failed: 'danger',
  exception: 'warning'
};

export const loadable = loader => Loadable({
  loading: Loading,
  loader
});
