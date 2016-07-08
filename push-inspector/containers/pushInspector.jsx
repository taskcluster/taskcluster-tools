import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';
import { authentication, webListener } from '../lib/utils';

class PushInspector extends Component {

  constructor(props) {
    super(props);
  }

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

  /**
  * Stop web listener
  */
  stopListening() {
    webListener.stopListening();
  }

  render() {
    const { tasks, children, setActiveTaskStatus, params, dashboardBanner, setDashboardBanner, tasksRetrievedFully } = this.props;
    const { taskGroupId } = params;
    const handleLoadingAndError = this.handleLoadingAndError();

    const listenerSleepMessage = 'The web listener has been put to sleep. Refresh the browser to see any updated changes.';
    const dashboardAction = this.stopListening;

    return (
      <div>
        
        {
          dashboardBanner == true ? 
          <DashboardBanner 
            dashboardHeaderMessage="Oops!"
            dashboardMessage={listenerSleepMessage} 
            setDashboardBanner={setDashboardBanner}
            action={dashboardAction}
            actionText="Stop listening"
            bsStyle="danger" /> :
          undefined
        }
        
        <Search
          taskGroupId = {taskGroupId} />
        <ProgressBar
          taskGroupId = {taskGroupId}
          tasks={tasks}
          setActiveTaskStatus={setActiveTaskStatus}
          tasksRetrievedFully={tasksRetrievedFully} />
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
    dashboardBanner: state.dashboardBanner,
    tasksNotAvailable: state.tasksNotAvailable,
    tasksRetrievedFully: state.tasksRetrievedFully
	}
}

export default connect(mapStateToProps, actions)(PushInspector)
