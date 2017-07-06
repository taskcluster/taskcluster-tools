import React from 'react';
import { array, bool, oneOfType, number, string, object } from 'prop-types';
import { MenuItem, NavItem, NavDropdown } from 'react-bootstrap';
import { isNil } from 'ramda';
import { getIconFromMime } from '../../utils';

export default class ArtifactList extends React.PureComponent {
  static propTypes = {
    artifacts: array,
    taskId: string,
    runId: oneOfType([
      string,
      number
    ]),
    menu: bool,
    queue: object.isRequired,
    style: object
  };

  static defaultProps = {
    menu: false,
    style: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      // list of artifacts with url built
      artifacts: null
    };
  }

  componentWillMount() {
    this.setState({
      artifacts: this.getArtifactList(this.props)
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      artifacts: this.getArtifactList(nextProps)
    });
  }

  getArtifactList({ runId, taskId, credentials, queue, artifacts, indexNamespace }) {
    if (!taskId || !artifacts) {
      return null;
    }

    // Build the URLs here so that they'll be updated when people login
    return artifacts.map(({ name, contentType }) => {
      if (/^public\//.test(name)) {
        const icon = getIconFromMime(contentType);

        // If we have a namespace, use a URL with that namespace to make it easier for users to copy/paste index URLs
        if (indexNamespace) {
          return { icon, name, url: `https://index.taskcluster.net/v1/task/${indexNamespace}/artifacts/${name}` };
        }

        // We could use queue.buildUrl, but this creates URLs where the artifact name has slashes encoded.
        // For artifacts we specifically allow slashes in the name unencoded, as this make things like
        // `wget ${URL}` create files with nice names.

        if (!isNil(runId)) {
          return { icon, name, url: `https://queue.taskcluster.net/v1/task/${taskId}/runs/${runId}/artifacts/${name}` };
        }

        return { icon, name, url: `https://queue.taskcluster.net/v1/task/${taskId}/artifacts/${name}` };
      }

      // If we have credentials we create a signed URL.
      // Note that signed URLs always point to the task directly, as they are not useful for users copy/pasting.
      if (credentials) {
        return {
          name,
          icon: getIconFromMime(contentType),
          url: isNil(runId) ?
            queue.buildSignedUrl(queue.getLatestArtifact, taskId, name) :
            queue.buildSignedUrl(queue.getArtifact, taskId, runId, name)
        };
      }

      return {
        name,
        url: null,
        icon: 'lock'
      };
    });
  }

  render() {
    const { menu, style } = this.props;
    const { artifacts } = this.state;

    if (!artifacts || !artifacts.length) {
      return menu ?
        <NavItem disabled>No artifacts</NavItem> :
        <div style={{ fontSize: 14, ...style }}>No artifacts</div>;
    }

    return menu ?
      (
        <NavDropdown title="Artifacts" id="artifacts-dropdown">
          {artifacts.map(({ name, icon, url }, index) => (
            <MenuItem href={url} target="_blank" rel="noopener noreferrer" key={`runs-menu-artifacts-${index}`}>
              <i className={`fa fa-${icon}`} style={{ marginRight: 5 }} /> {name}
            </MenuItem>
          ))}
        </NavDropdown>
      ) :
      (
        <div style={{ fontSize: 14, ...style }}>
          {artifacts.map(({ name, icon, url }, index) => (
            <div key={`runs-menu-artifacts-${index}`} style={{ marginBottom: 8 }}>
              <i className={`fa fa-${icon}`} style={{ marginRight: 5 }} />
              <a href={url} target="_blank" rel="noopener noreferrer">{name}</a>
            </div>
          ))}
        </div>
      );
  }
}
