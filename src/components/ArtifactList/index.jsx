import { PureComponent } from 'react';
import { array, bool, oneOfType, number, string, object } from 'prop-types';
import { MenuItem, NavItem, NavDropdown } from 'react-bootstrap';
import { isNil } from 'ramda';
import Error from '../../components/Error';
import { getIconFromMime } from '../../utils';

export default class ArtifactList extends PureComponent {
  static propTypes = {
    artifacts: array,
    taskId: string,
    runId: oneOfType([string, number]),
    menu: bool,
    queue: object.isRequired,
    userSession: object,
    style: object
  };

  static defaultProps = {
    menu: false,
    style: {},
    artifacts: null
  };

  constructor(props) {
    super(props);

    this.state = {
      // list of artifacts with url built
      artifacts: null
    };
  }

  componentWillMount() {
    this.loadArtifactList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.loadArtifactList(nextProps);
  }

  loadArtifactList({
    runId,
    taskId,
    userSession,
    queue,
    artifacts,
    namespace
  }) {
    if (!taskId || !artifacts) {
      return null;
    }

    // Build the URLs here so that they'll be updated when people login
    Promise.all(
      artifacts.map(async ({ name, contentType }) => {
        if (/^public\//.test(name)) {
          const icon = getIconFromMime(contentType);

          // If we have a namespace, use a URL with that namespace to make it easier for users to copy/paste index URLs
          if (namespace) {
            return {
              icon,
              name,
              url: `https://index.taskcluster.net/v1/task/${namespace}/artifacts/${name}`
            };
          }

          // We could use queue.buildUrl, but this creates URLs where the artifact name has slashes encoded.
          // For artifacts we specifically allow slashes in the name unencoded, as this make things like
          // `wget ${URL}` create files with nice names.

          if (!isNil(runId)) {
            return {
              icon,
              name,
              url: `https://queue.taskcluster.net/v1/task/${taskId}/runs/${runId}/artifacts/${name}`
            };
          }

          return {
            icon,
            name,
            url: `https://queue.taskcluster.net/v1/task/${taskId}/artifacts/${name}`
          };
        }

        // If we have userSession we create a signed URL.
        // Note that signed URLs always point to the task directly, as they are not useful for users copy/pasting.
        if (userSession) {
          return {
            name,
            locked: true,
            icon: getIconFromMime(contentType),
            url: isNil(runId)
              ? await queue.buildSignedUrl(
                  queue.getLatestArtifact,
                  taskId,
                  name
                )
              : await queue.buildSignedUrl(
                  queue.getArtifact,
                  taskId,
                  runId,
                  name
                )
          };
        }

        return {
          name,
          url: null
        };
      })
    )
      .then(artifacts => this.setState({ error: null, artifacts }))
      .catch(error => this.setState({ error, artifacts: [] }));
  }

  render() {
    const { menu, style } = this.props;
    const { artifacts, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!artifacts || !artifacts.length) {
      return menu ? (
        <NavItem disabled>No artifacts</NavItem>
      ) : (
        <div style={{ fontSize: 14, ...style }}>No artifacts</div>
      );
    }

    return menu ? (
      <NavDropdown title="Artifacts" id="artifacts-dropdown">
        {artifacts.map(({ name, icon, url }, index) => (
          <MenuItem
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            key={`runs-menu-artifacts-${index}`}>
            <i className={`fa fa-${icon}`} style={{ marginRight: 5 }} /> {name}
          </MenuItem>
        ))}
      </NavDropdown>
    ) : (
      <div style={{ fontSize: 14, ...style }}>
        {artifacts.map(({ name, locked, icon, url }, index) => (
          <div key={`runs-menu-artifacts-${index}`} style={{ marginBottom: 8 }}>
            {locked && <i className="fa fa-lock" style={{ marginRight: 5 }} />}
            <i className={`fa fa-${icon}`} style={{ marginRight: 5 }} />
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          </div>
        ))}
      </div>
    );
  }
}
