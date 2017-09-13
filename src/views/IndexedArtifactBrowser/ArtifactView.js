import React from 'react';
import { string, object } from 'prop-types';
import equal from 'deep-equal';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import ArtifactList from '../../components/ArtifactList';

export default class ArtifactView extends React.PureComponent {
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
    if (nextProps.namespace !== this.props.namespace || nextProps.taskId !== this.props.taskId) {
      this.loadArtifacts(nextProps);
    } else if (this.state.error && !equal(nextProps.userSession, this.props.userSession)) {
      this.setState({ error: null });
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
        userSession={userSession} />
    );
  }
}
