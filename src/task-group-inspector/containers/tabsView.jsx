import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import path from 'path';
import CancelTask from '../menus/CancelTask';
import PurgeCache from '../menus/PurgeCache';
import Retrigger from '../menus/Retrigger';
import ScheduleTask from '../menus/ScheduleTask';
import RunInfo from '../../lib/ui/runinfo';
import TaskInfo from '../../lib/ui/taskinfo';

class TabsView extends Component {
  fetchTaskData() {
    const {match, fetchArtifacts, fetchTask, fetchStatus} = this.props;

    fetchArtifacts(match.params.taskId);
    fetchTask(match.params.taskId);
    fetchStatus(match.params.taskId);
  }

  componentWillMount() {
    const {run}= this.props.match.params;

    this.fetchTaskData();

    if (this.isNumber(run)) {
      this.setCurrentTab(run)
    }
  }

  /**
   * Handle case where user picks another task to show
   */
  componentDidUpdate(prevProps) {
    //  This can happen when retriggering a task or clicking on a task
    if (prevProps.match.params.taskId !== this.props.match.params.taskId) {
      this.fetchTaskData();
      this.setCurrentTab('');
    }
  }

  isNumber(term) {
    return !isNaN(parseInt(term));
  }

  render() {
    const {task, status, match} = this.props;
    const currentTab = this.isNumber(match.params.run) ? match.params.run : '';

    if (!task || !status) {
      return null;
    }

    return (
      <div>
        <Nav bsStyle="tabs" activeKey={currentTab} onSelect={tab => this.setCurrentTab(tab)}>
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
    const {taskGroupId, taskId, run} = this.props.match.params;
    let section = '';

    // Persist the section path of the URL if user is only switching between runs
    if (this.props.match.params.section && this.isNumber(tab) && this.isNumber(run)) {
      section = this.props.match.params.section;
    }

    // Add 'details' section to the URL if a run has no section path
    else if (!this.props.match.params.section && this.isNumber(tab)) {
      section = 'details';
    }

    this.props.history.push(path.join('/task-group-inspector', taskGroupId, taskId, tab, section));
  }

  renderCurrentTab() {
    const {task, status, match} = this.props;
    const currentTab = this.isNumber(match.params.run) ? match.params.run : '';

    // Empty string is the task tab, but zero is a possible value
    if (currentTab === '') {
      return <TaskInfo status={status} task={task} />;
    }

    // Select first run if no run is specified in URL
    const run = status.runs[currentTab];

    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong> The task does not seem to have the requested run.
        </div>
      );
    }

    return <RunInfo
      status={status}
      run={run} ref="runInfo"
      activeTabOnInit={this.props.match.params.section}
      {...this.props}
    />;
  }
}

const mapStateToProps = ({task, status, artifacts}) => ({task, status, artifacts});

export default connect(mapStateToProps, actions)(TabsView);
