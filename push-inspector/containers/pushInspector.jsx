import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';

class PushInspector extends Component {

  render() {
    const { tasks, children, setActiveTaskStatus, params, bannerFlag, setDashboardBanner } = this.props;
    const { taskGroupId } = params;
    return (
      <div>
        <DashboardBanner showBanner={bannerFlag} setBanner={setDashboardBanner} />
        <Search />
        <ProgressBar
            taskGroupId = {taskGroupId}
            tasks={tasks}
            setActiveTaskStatus={setActiveTaskStatus}/>
        <div className={(!!tasks.length && !!taskGroupId) || (!!!tasks.length && !!!taskGroupId) ? "hideDisplay" : ""}>
          <Loading />
        </div>
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
    bannerFlag: state.dashboardBanner
	}
}

export default connect(mapStateToProps, actions)(PushInspector)
