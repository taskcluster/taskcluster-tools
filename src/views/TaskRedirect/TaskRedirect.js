import React from 'react';
import { Redirect } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';

export default class TaskRedirect extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      taskGroupId: null,
      error: null
    };
  }

  async componentWillMount() {
    try {
      const { status } = await this.props.queue.status(this.props.taskId);

      this.setState({ taskGroupId: status.taskGroupId });
    } catch (err) {
      this.setState({ taskGroupId: null, error: err });
    }
  }

  render() {
    const { taskGroupId, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!taskGroupId) {
      return <Spinner />;
    }

    return <Redirect to={`/groups/${taskGroupId}/tasks/${this.props.taskId}`} />;
  }
}
