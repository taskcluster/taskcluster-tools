import { PureComponent } from 'react';
import { Redirect } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';
import { parameterizeTask } from '../../utils';

export default class TaskRedirect extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      taskGroupId: null,
      task: null,
      error: null
    };
  }

  async componentWillMount() {
    const { taskId, queue, action } = this.props;

    try {
      if (action === 'create') {
        return this.setState({
          task: await queue.task(taskId)
        });
      } else if (action === 'interactive') {
        return this.setState({
          task: parameterizeTask(await queue.task(taskId))
        });
      }

      const { status } = await queue.status(taskId);

      this.setState({ taskGroupId: status.taskGroupId });
    } catch (err) {
      this.setState({ taskGroupId: null, error: err });
    }
  }

  renderTaskRedirect() {
    const { taskId, action } = this.props;
    const { taskGroupId, task, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!taskGroupId && !task) {
      return <Spinner />;
    }

    if (task) {
      return (
        <Redirect
          to={{
            pathname:
              action === 'interactive'
                ? '/tasks/create/interactive'
                : '/tasks/create',
            state: { task }
          }}
        />
      );
    }

    return <Redirect to={`/groups/${taskGroupId}/tasks/${taskId}`} />;
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
