import React, { Component } from 'react';
import { queue } from '../lib/utils';
import { connect } from 'react-redux';
import * as actions from '../actions';
import auth from '../../lib/auth';

// Matching patterns for finding an icon from a mimetype, most specific
// mimetypes are listed first as they are matched top down.
const MIMETYPE_ICONS = [
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
      'application/x-gtar'
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
const getIconFromMime = (contentType) => {
  const entry = MIMETYPE_ICONS.find(entry => {
    return entry.matches
      .some(pattern => pattern instanceof RegExp ?
        pattern.test(contentType) :
        pattern === contentType
      );    
  });

  return entry.icon || 'file-o';
};

class ArtifactList extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      artifacts: this.props.artifacts || []
    };
  }

  componentWillMount() {
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    this.load();
  }
  
  /** Build the right url for artifacts */
  load() {
    const artifacts = this.props.artifacts.map(({ name, contentType }) => {
      const isPublic = /^public\//.test(name);
      const hasCredentials = auth.hasCredentials();

      if (!isPublic && !hasCredentials) {
        return {
          name,
          icon: 'lock'
        };
      }

      const method = hasCredentials ? 'buildSignedUrl' : 'buildUrl';
      const args = this.props.runId ?
        [queue.getArtifact, this.props.taskId, this.props.runId, name] :
        [queue.getLatestArtifact, this.props.taskId, name];

      return {
        name,
        icon: getIconFromMime(contentType),
        url: queue[method](...args)
      };
    });

    this.setState({ artifacts });
  }

  render() {    
    const { artifacts } = this.state;
    
    if (!artifacts.length) {
      return <div></div>;
    }
 
    return (
      <ul className="artifact-ul">
        {artifacts.map((artifact, index) => {
          return (
            <li key={index}>
              <i className={`fa fa-${artifact.icon}`} />
              <a href={artifact.url} target="_blank"> {artifact.name}</a>
            </li>
          ); 
        })}
      </ul>
    );            
  }
}

export default connect(null, actions)(ArtifactList);
