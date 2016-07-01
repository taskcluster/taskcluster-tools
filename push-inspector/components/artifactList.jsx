import React, { Component } from 'react';
import { queue } from '../lib/utils';
import { connect } from 'react-redux';
import * as actions from '../actions';
import auth from '../../lib/auth';


// Matching patterns for finding an icon from a mimetype, most specific
// mimetype are listed first as they are matched top down.
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
const getIconFromMime = function(contentType) {
  for (var i =  0; i < MIMETYPE_ICONS.length; i++) {
    const entry = MIMETYPE_ICONS[i];
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

class ArtifactList extends Component {

	constructor(props) {
		super(props);
		this.state = {
			artifacts: this.props.artifacts || []
		}
	}

	componentWillMount() {
		this.load();
	}

  handleArtifactCreatedMessage() {
    const { taskId, fetchArtifacts } = this.props;
    fetchArtifacts();
  }
	
	/** Build the right url for artifacts */
	load() {
		// Build the Urls where so that they'll be updated, if when people login
    // with credentials
    let artifacts = this.props.artifacts.map(function(artifact) {
      let url, icon;
      if (/^public\//.test(artifact.name)) {
        if (this.props.runId !== undefined) {
          url = queue.buildUrl(
            queue.getArtifact,
            this.props.taskId,
            this.props.runId,
            artifact.name
          );
        } else {
          url = queue.buildUrl(
            queue.getLatestArtifact,
            this.props.taskId,
            artifact.name
          );
        }
        icon = getIconFromMime(artifact.contentType);
      } else {
        // If we have credentials we create a signed URL
        if (auth.hasCredentials()) {
          if (this.props.runId !== undefined) {
            url = queue.buildSignedUrl(
              queue.getArtifact,
              this.props.taskId,
              this.props.runId,
              artifact.name
            );
          } else {
            url = queue.buildSignedUrl(
              queue.getLatestArtifact,
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
	}

	renderArtifactList() {
		const { artifacts } = this.state;
		if(!!artifacts.length) {
			return (
				<ul className="artifact-ul">
					{
						artifacts.map((artifact,index) => {
			        return (
			          <li key={index}>
			          	<i className={('fa fa-' + artifact.icon)}>&nbsp;</i>
			          	<a href={artifact.url} target="_blank">{artifact.name}</a>
		      			</li>
			        )
			      })		
					}
				</ul>
			)      
  	} 

	}


	render() {
	    
	    const artifactList = this.renderArtifactList();

	    return (
	      <div>
	        {artifactList}
	      </div>
	    );
  	}

}
export default connect(null, actions)(ArtifactList)