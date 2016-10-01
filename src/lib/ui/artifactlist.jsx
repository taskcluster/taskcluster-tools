import React from 'react';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap';
import * as utils from '../utils';
import taskcluster from 'taskcluster-client';
import * as auth from '../auth';

// Matching patterns for finding an icon from a mimetype, most specific
// mimetype are listed first as they are matched top down.
const MIMETYPE_ICONS = [
  {
    icon: 'file-pdf-o',
    matches: ['application/pdf', 'application/postscript']
  }, {
    icon: 'file-archive-o',
    matches: [
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
      'application/x-gtar'

    ]
  }, {
    icon: 'file-word-o',
    matches: ['text/rtf', 'text/html']
  }, {
    icon: 'file-excel-o',
    matches: ['text/csv']
  }, {
    icon: 'file-powerpoint-o',
    matches: []
  }, {
    icon: 'file-code-o',
    matches: [
      'application/javascript',
      'application/json',
      'application/xml',
      'text/css',
      'text/javascript',
      'text/xml',
      'application/ecmascript'
    ]
  }, {
    icon: 'file-video-o',
    matches: [/^video\//]
  }, {
    icon: 'file-image-o',
    matches: [/^image\//]
  }, {
    icon: 'file-text-o',
    matches: [/^text\//]
  }, {
    icon: 'file-audio-o',
    matches: [/^audio\//]
  }, {
    icon: 'file-text-o',
    matches: [/^text\//]
  }, {
    icon: 'file-text-o',
    matches: [/^text\//]
  }, {
    icon: 'file-archive-o',
    matches: [/compressed/, /tar/, /zip/]
  }, {
    icon: 'file-o',
    matches: [/.*/]
  }
];

/** Get icon from mimetype */
const getIconFromMime = contentType => {
  for (let i = 0; i < MIMETYPE_ICONS.length; i++) {
    const entry = MIMETYPE_ICONS[i];
    const matches = entry.matches.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(contentType);
      }

      return pattern === contentType;
    });

    if (matches) {
      return entry.icon;
    }
  }

  return 'file-o';
};

/** Displays a list of artifacts */
export default React.createClass({
  displayName: 'ArtifactList',

  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue
      },
      // Reload when taskId changes or runId
      reloadOnProps: ['taskId', 'runId', 'artifacts'],
      reloadOnLogin: true
    })
  ],

  // Validate properties
  propTypes: {
    artifacts: React.PropTypes.array.isRequired,
    taskId: React.PropTypes.string.isRequired,
    // If not provided, latestArtifact is used
    runId: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ])
  },

  /** Get initial state */
  getInitialState() {
    return {
      // list of artifacts with url built
      artifacts: []
    };
  },

  /** Build the right url for artifacts */
  load() {
    // Build the Urls where so that they'll be updated, if when people login
    // with credentials
    const artifacts = this.props.artifacts.map(artifact => {
      let url;
      let icon;

      if (/^public\//.test(artifact.name)) {
        url = 'https://queue.taskcluster.net/v1/task/';
        if (this.props.runId != null) {
          url += `${this.props.taskId}/runs/${this.props.runId}/artifacts/${artifact.name}`;
          // We could use queue.buildUrl as follows, but this creates URLs where artifact name
          // has slashes encoded. For artifacts we specifically allow slashes in the name not
          // to be encoded, as this make things like: $ wget <url> create files with nice names.
          // url = this.queue.buildUrl(
          //   this.queue.getArtifact,
          //   this.props.taskId,
          //   this.props.runId,
          //   artifact.name
          // );
        } else {
          url += `${this.props.taskId}/artifacts/${artifact.name}`;
        }

        icon = getIconFromMime(artifact.contentType);
      } else if (auth.hasCredentials()) {
        // If we have credentials we create a signed URL
        if (this.props.runId != null) {
          url = this.queue.buildSignedUrl(
            this.queue.getArtifact,
            this.props.taskId,
            this.props.runId,
            artifact.name
          );
        } else {
          url = this.queue.buildSignedUrl(
            this.queue.getLatestArtifact,
            this.props.taskId,
            artifact.name
          );
        }

        icon = getIconFromMime(artifact.contentType);
      } else {
        // If don't have credentials we don't provide a URL and set icon
        // to lock
        url = null;
        icon = 'lock';
      }

      return {
        url,
        icon,
        name: artifact.name
      };
    });

    this.setState({ artifacts });
  },

  render() {
    return (
      <div style={{ fontSize: 14 }}>
        {this.state.artifacts.map((artifact, key) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <i className={`fa fa-${artifact.icon}`} style={{ marginRight: 5 }} />
            <a href={artifact.url} target="_blank">{artifact.name}</a>
          </div>
        ))}
      </div>
    );
  }
});
