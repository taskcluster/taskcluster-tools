import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';

class PushInspector extends Component {

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
