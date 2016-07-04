import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';
import { authentication } from '../lib/utils';
class PushInspector extends Component {

  /**
  * handleLoadingAndError handles error and show the loading icon
  */
  handleLoadingAndError() {
    const { tasks, tasksNotAvailable, params } = this.props;
    const taskGroupId = params.taskGroupId;

    if(tasksNotAvailable) {
      return <div>No task-group with taskGroupId: {taskGroupId}</div>
    }
    if(!tasks.length && !!taskGroupId) {
      return <Loading />
    }
  }

  /**
  * Event handler for changed credentials
  */
  handleCredentialsChanged(e) {
    authentication.login(e.detail);
  }

  /**
  * Setup an event listener, listening for credential changes
  */
  componentWillMount() {
    window.addEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  }

  render() {
    const { tasks, children, setActiveTaskStatus, params, bannerFlag, setDashboardBanner } = this.props;
    const { taskGroupId } = params;
    const handleLoadingAndError = this.handleLoadingAndError();
    return (
      <div>
        <DashboardBanner showBanner={bannerFlag} setBanner={setDashboardBanner} />
        <Search
          taskGroupId = {taskGroupId} />
        <ProgressBar
          taskGroupId = {taskGroupId}
          tasks={tasks}
          setActiveTaskStatus={setActiveTaskStatus}/>
        {handleLoadingAndError}
        <div className={!!!tasks.length ? "hideDisplay" : ""}>
          {children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
	return {
		tasks: state.tasks,
    bannerFlag: state.dashboardBanner,
    tasksNotAvailable: state.tasksNotAvailable
	}
}

export default connect(mapStateToProps, actions)(PushInspector)
