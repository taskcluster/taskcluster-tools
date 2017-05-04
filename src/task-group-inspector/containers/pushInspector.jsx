import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import {connect} from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';
import DashboardBanner from '../shared/dashboardBanner';
import {authentication, rendering} from '../lib/utils';
import Listings from './listings';

class PushInspector extends Component {
  componentWillMount() {
    window.addEventListener('credentials-changed', e => authentication.login(e.detail), false);
  }

  render() {
    const {tasks, dashboardBanner} = this.props;
    const {taskGroupId} = this.props.match.params;

    return (
      <div>
        <h4>Task Group Inspector</h4>
        <p>
          Inspect task groups, monitor progress, view dependencies and states, and inspect
          the individual tasks that make up the task group using the embedded task-inspector.
        </p>
        <hr />
        <Search taskGroupId={taskGroupId} {...this.props} />
        <hr />
        {
          dashboardBanner ? (
            <DashboardBanner
              title="Error"
              bsStyle="danger"
              message={rendering.renderError(dashboardBanner)} />
          ) : (
            <div>
              {taskGroupId && !tasks.length && <Loading />}
              <div style={{display: taskGroupId && tasks.length ? 'block' : 'none'}}>
                <ProgressBar
                  taskGroupId={taskGroupId}
                  tasks={tasks}
                  setActiveTaskStatus={this.props.setActiveTaskStatus}
                  tasksRetrievedFully={this.props.tasksRetrievedFully} />
                <hr />
                <Route path={`/task-group-inspector/:taskGroupId/:taskId?/:run?/:section?`} render={(props) => <Listings {...props} />} />
              </div>
            </div>
          )
        }
      </div>
    );
  }
}

const mapStateToProps = ({tasks, status, dashboardBanner, tasksRetrievedFully}) => ({
  tasks, status, dashboardBanner, tasksRetrievedFully,
});

export default connect(mapStateToProps, actions)(PushInspector);
