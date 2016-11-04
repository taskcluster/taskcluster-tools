import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import CancelTask from '../menus/CancelTask';
import PurgeCache from '../menus/PurgeCache';
import Retrigger from '../menus/Retrigger';
import ScheduleTask from '../menus/ScheduleTask';
import RunInfo from '../../lib/ui/runinfo';
import TaskInfo from '../../lib/ui/taskinfo';

class TabsView extends Component {
  constructor() {
    super();
    this.state = {currentTab: ''};
  }

  fetchTaskData() {
    const {params, fetchArtifacts, fetchTask, fetchStatus} = this.props;

    fetchArtifacts(params.taskId);
    fetchTask(params.taskId);
    fetchStatus(params.taskId);
  }

  componentWillMount() {
    this.fetchTaskData();
  }

  /**
  * Handle case where user picks another task to show
  */
  componentDidUpdate(prevProps) {
    //  This can happen when retriggering a task or clicking on a task
    if (prevProps.params.taskId !== this.props.params.taskId) {
      this.fetchTaskData();
      this.setCurrentTab('');
    }
  }

  render() {
    const {task, status} = this.props;

    if (!task || !status) {
      return null;
    }

    return (
      <div>
        <Nav bsStyle="tabs" activeKey={`${this.state.currentTab}`} onSelect={tab => this.setCurrentTab(tab)}>
          <NavItem eventKey="" key="">Task Details</NavItem>
          <NavDropdown title="Actions" id="task-view-actions">
            <ScheduleTask />
            <Retrigger task={task} />
            <CancelTask />
            <PurgeCache
              caches={task && task.payload && task.payload.cache ?
                Object.keys(task.payload.cache) :
                []}
              provisionerId={task.provisionerId}
              workerType={task.workerType} />
          </NavDropdown>
          <NavDropdown eventKey="runs" title="Runs" key="runs" id="task-view-runs">
            {status.runs.map(({runId}) => (
              <MenuItem eventKey={`${runId}`} key={`${runId}`}>
                Run {runId}
              </MenuItem>
            ))}
          </NavDropdown>
        </Nav>
        <div className="tab-content">
          <div className="tab-pane active" style={{paddingTop: 20}}>
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  }

  setCurrentTab(tab) {
    this.setState({currentTab: tab});
  }

  renderCurrentTab() {
    const {task, status} = this.props;

    // Empty string is the task tab, but zero is a possible value
    if (this.state.currentTab === '') {
      return <TaskInfo status={status} task={task} />;
    }

    // Check if we have the run in current tab
    const run = status.runs[this.state.currentTab];

    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong> The task does not seem to have the requested run.
        </div>
      );
    }

    return <RunInfo status={status} run={run} ref="runInfo" />;
  }
}

const mapStateToProps = ({task, status, artifacts}) => ({task, status, artifacts});

export default connect(mapStateToProps, actions)(TabsView);
