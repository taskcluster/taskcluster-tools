var React           = require('react');
var utils           = require('../utils');
var taskcluster     = require('taskcluster-client');
var auth            = require('../auth');


// Matching patterns for finding an icon from a mimetype, most specific
// mimetype are listed first as they are matched top down.
var MIMETYPE_ICONS = [
  {
    icon:       'file-pdf-o',
    matches:    ['application/pdf', 'application/postscript']
  }, {
    icon:       'file-archive-o',
    matches:    [
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

    ]
  }, {
    icon:       'file-word-o',
    matches:    ['text/rtf', 'text/html']
  }, {
    icon:       'file-excel-o',
    matches:    ['text/csv']
  }, {
    icon:       'file-powerpoint-o',
    matches:    []
  }, {
    icon:       'file-code-o',
    matches:    [
      'application/javascript',
      'application/json',
      'application/xml',
      'text/css',
      'text/javascript',
      'text/xml',
      'application/ecmascript'
    ]
  }, {
    icon:       'file-video-o',
    matches:    [/^video\//]
  }, {
    icon:       'file-image-o',
    matches:    [/^image\//]
  }, {
    icon:       'file-text-o',
    matches:    [/^text\//]
  }, {
    icon:       'file-audio-o',
    matches:    [/^audio\//]
  }, {
    icon:       'file-text-o',
    matches:    [/^text\//]
  }, {
    icon:       'file-text-o',
    matches:    [/^text\//]
  }, {
    icon:       'file-archive-o',
    matches:    [/compressed/, /tar/, /zip/]
  }, {
    icon:       'file-o',
    matches:    [/.*/]
  }
];

/** Get icon from mimetype */
var getIconFromMime = function(contentType) {
  for (var i =  0; i < MIMETYPE_ICONS.length; i++) {
    var entry = MIMETYPE_ICONS[i];
    if (entry.matches.some(function(pattern) {
      if (pattern instanceof RegExp) {
        return pattern.test(contentType);
      }
      return pattern === contentType;
    })) {
      return entry.icon;
    }
  };
  return 'file-o';
};

/** Displays a list of artifacts */
var ArtifactList = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue:                taskcluster.Queue
      },
      // Reload when taskId changes or runId
      reloadOnProps:          ['taskId', 'runId', 'artifacts'],
      reloadOnLogin:          true
    })
  ],

  // Validate properties
  propTypes: {
    artifacts:  React.PropTypes.array.isRequired,
    taskId:     React.PropTypes.string.isRequired,
    runId:      React.PropTypes.oneOfType([
                  React.PropTypes.string,
                  React.PropTypes.number
                ])  // If not provided, latestArtifact is used
  },

  /** Get initial state */
  getInitialState: function() {
    return {
      artifacts:      []  // list of artifacts with url built
    };
  },

  /** Build the right url for artifacts */
  load: function() {
    // Build the Urls where so that they'll be updated, if when people login
    // with credentials
    var artifacts = this.props.artifacts.map(function(artifact) {
      var url, icon;
      if (/^public\//.test(artifact.name)) {
        if (this.props.runId !== undefined) {
          url = this.queue.buildUrl(
            this.queue.getArtifact,
            this.props.taskId,
            this.props.runId,
            artifact.name
          );
        } else {
          url = this.queue.buildUrl(
            this.queue.getLatestArtifact,
            this.props.taskId,
            artifact.name
          );
        }
        icon = getIconFromMime(artifact.contentType);
      } else {
        // If we have credentials we create a signed URL
        if (auth.hasCredentials()) {
          if (this.props.runId !== undefined) {
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
          icon = getIconFromMime(artifact.contentType)
        } else {
          // If don't have credentials we don't provide a URL and set icon
          // to lock
          url   = undefined;
          icon  = 'lock';
        }
      }
      return {
        name:     artifact.name,
        url:      url,
        icon:     icon
      };
    }, this);

    this.setState({
      artifacts:   artifacts
    });
  },

  render: function() {
    return (
      <ul className="fa-ul">
      {
        this.state.artifacts.map(function(artifact, index) {
          return (
              <li key={index}>
                <i className={('fa-li fa fa-' + artifact.icon)}></i>
                <a href={artifact.url} target="_blank">
                  {artifact.name}
                </a>
              </li>
          );
        }, this)
      }
      </ul>
    );
  }

});

// Export ArtifactList
module.exports = ArtifactList;
