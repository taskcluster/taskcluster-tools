import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';
import {authentication, rendering} from '../lib/utils';

class PushInspector extends Component {
  /**
  * handleLoadingAndError handles error and show the loading icon
  */
  handleLoadingAndError() {
    const {tasks, params} = this.props;
    const taskGroupId = params.taskGroupId;

    if (!tasks.length && taskGroupId) {
      return <Loading />;
    }
  }

  /**
  * Setup an event listener, listening for credential changes
  */
  componentWillMount() {
    window.addEventListener('credentials-changed', e => authentication.login(e.detail), false);
  }

  render() {
    const {
      tasks, status, children, setActiveTaskStatus,
      params, dashboardBanner, tasksRetrievedFully,
    } = this.props;
    const {taskGroupId, taskId} = params;
    const handleLoadingAndError = this.handleLoadingAndError();

    if (dashboardBanner) {
      return (
        <div>
          <DashboardBanner
            title="Error"
            bsStyle="danger"
            message={rendering.renderError(dashboardBanner)} />
          <Search taskGroupId={taskGroupId} />
        </div>
      );
    }

    return (
      <div>
        <h4>Push Inspector</h4>
        <p>
          Inspect task groups, monitor progress, view dependencies and states, and inspect
          the individual tasks that make up the task group using the embedded task-inspector.
        </p>
        <hr />
        <Search taskGroupId={taskGroupId} />
        <hr />
        <ProgressBar
          taskGroupId={taskGroupId}
          taskId={taskId}
          tasks={tasks}
          status={status}
          setActiveTaskStatus={setActiveTaskStatus}
          tasksRetrievedFully={tasksRetrievedFully} />
        {handleLoadingAndError}
        <hr />
        <div className={!tasks.length ? 'hideDisplay' : ''}>
          {children}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({tasks, status, dashboardBanner, tasksRetrievedFully}) => (
  {tasks, status, dashboardBanner, tasksRetrievedFully}
);

export default connect(mapStateToProps, actions)(PushInspector);
