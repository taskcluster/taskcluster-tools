import React from 'react';
import { Redirect } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';

export default class TaskRedirect extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      taskGroupId: null,
      task: null,
      error: null
    };
  }

  async componentWillMount() {
    const { taskId, queue } = this.props;

    try {
      if (this.props.action === 'create') {
        return this.setState({
          task: await queue.task(taskId)
        });
      }

      const { status } = await this.props.queue.status(this.props.taskId);

      this.setState({ taskGroupId: status.taskGroupId });
    } catch (err) {
      this.setState({ taskGroupId: null, error: err });
    }
  }

  renderTaskRedirect() {
    const { taskGroupId, task, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!taskGroupId && !task) {
      return <Spinner />;
    }

    if (task) {
      return (<Redirect
        to={{
          pathname: '/tasks/create',
          state: { task }
        }} />);
    }

    return <Redirect to={`/groups/${taskGroupId}/tasks/${this.props.taskId}`} />;
  }

  render() {
    return (
      <div>
        <HelmetTitle blank />
        {this.renderTaskRedirect()}
      </div>
    );
  }
}
