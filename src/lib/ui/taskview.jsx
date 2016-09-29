import React from 'react';
import { Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import * as utils from '../utils';
import TaskInfo from './taskinfo';
import RunInfo from './runinfo';
import './taskview.less';

/** Takes a task status structure and renders tabs for taskInfo and runInfo */
const TaskView = React.createClass({
  mixins: [
    // Serialize state.currentTab to location.hash as string
    utils.createLocationHashMixin({
      keys: ['currentTab'],
      type: 'string'
    })
  ],

  // Get initial state
  getInitialState() {
    return {
      // Empty string is the task view
      currentTab: this.props.initialTab
    };
  },

  // Create default properties
  getDefaultProps() {
    return {
      // Initial tab to show (empty string is task view)
      initialTab: ''
    };
  },

  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired
  },

  // Render tabs and current tab
  render() {
    const initialRuns = this.props.status.runs.slice(0, 6);
    const extraRuns = this.props.status.runs.slice(6);

    return (
      <div className="task-view">
        <Nav bsStyle="tabs" activeKey={`${this.state.currentTab}`} onSelect={this.setCurrentTab}>
          <NavItem eventKey={''} key={''}>Task</NavItem>
          {initialRuns.map(({ runId }) => (
            <NavItem eventKey={`${runId}`} key={`${runId}`}>
              Run {runId}
            </NavItem>
          ))}
          {extraRuns.length ? (
              <NavDropdown
                id="more-runs-dropdown"
                eventKey="extra"
                title="More Runs"
                key="extra">
                  {extraRuns.map(({ runId }) => (
                    <MenuItem eventKey={`${runId}`} key={`${runId}`}>
                      Run {runId}
                    </MenuItem>
                  ))}
              </NavDropdown>
            ) :
            null
          }
        </Nav>
        <div className="tab-content">
          <div className="tab-pane active">
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  },

  /** Render current tab */
  renderCurrentTab() {
    // Empty string is the task tab, but zero is a possible value
    if (this.state.currentTab === '') {
      return <TaskInfo status={this.props.status} />;
    }

    // Check if we have the run in current tab
    const run = this.props.status.runs[this.state.currentTab];

    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong> The task does not seem to have the requested run.
        </div>
      );
    }

    // return a RunInfo
    return <RunInfo status={this.props.status} run={run} ref="runInfo" />;
  },

  // Set currentTab
  setCurrentTab(tab) {
    // Update state
    this.setState({
      currentTab: tab
    });
  },

  // Tell child that we got an artifact created message
  handleArtifactCreatedMessage(message) {
    if (this.refs.runInfo) {
      this.refs.runInfo.handleArtifactCreatedMessage(message);
    }
  }
});

export default TaskView;
