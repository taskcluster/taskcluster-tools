import { PureComponent } from 'react';
import { string, object } from 'prop-types';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import ArtifactList from '../../components/ArtifactList';
import UserSession from '../../auth/UserSession';

export default class ArtifactView extends PureComponent {
  static propTypes = {
    queue: object,
    taskId: string,
    namespace: string
  };

  constructor(props) {
    super(props);

    this.state = {
      artifacts: null
    };
  }

  componentWillMount() {
    this.loadArtifacts(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (
      nextProps.namespace !== this.props.namespace ||
      nextProps.taskId !== this.props.taskId
    ) {
      this.loadArtifacts(nextProps);
    }
  }

  async loadArtifacts(props) {
    try {
      const { artifacts } = await props.queue.listLatestArtifacts(props.taskId);

      this.setState({
        artifacts,
        error: null
      });
    } catch (err) {
      this.setState({
        error: err,
        artifacts: null
      });
    }
  }

  render() {
    const { queue, taskId, namespace, userSession } = this.props;
    const { error, artifacts } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!artifacts) {
      return <Spinner />;
    }

    return (
      <ArtifactList
        queue={queue}
        namespace={namespace}
        artifacts={this.state.artifacts}
        taskId={taskId}
        userSession={userSession}
      />
    );
  }
}
