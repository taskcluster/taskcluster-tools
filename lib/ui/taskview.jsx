/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../utils');
var format          = require('../format');
var _               = require('lodash');
var TaskInfo        = require('./taskinfo');
var RunInfo         = require('./runinfo');

/** Takes a task status structure and renders tabs for taskInfo and runInfo */
var TaskView = React.createClass({
  mixins: [
    // Serialize state.currentTab to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['currentTab'],
      type:                   'string'
    })
  ],

  // Get initial state
  getInitialState: function() {
    return {
      currentTab:   this.props.initialTab   // Empty string is the task view
    };
  },

  // Create default properties
  getDefaultProps: function() {
    return {
      initialTab:   '',   // Initial tab to show (empty string is task view)
    };
  },

  // Validate properties
  propTypes: {
    status:         React.PropTypes.object.isRequired,
  },

  // Render tabs and current tab
  render: function() {
    return (
      <div className="task-view">
        <ul className="nav nav-tabs" role="tablist">
          <li className={this.state.currentTab === '' ? 'active' : ''}>
            <a className="tab"
               onClick={this.setCurrentTab.bind(this, '')}>Task</a>
          </li>
          {this.renderTabs()}
          {this.renderDropDown()}
        </ul>
        <div className="tab-content">
          <div className="tab-pane active">
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  },

  /** Render tabs */
  renderTabs: function() {
    // Show tabs for the first 6 runs
    var currentTab = this.state.currentTab;
    return this.props.status.runs.slice(0, 6).map(function(run, index) {
      return (
        <li key={index}
            className={currentTab + '' === run.runId + '' ? 'active' : ''}>
          <a className="tab"
             onClick={this.setCurrentTab.bind(this, run.runId)}>
             Run {run.runId}
          </a>
        </li>
      );
    }, this);
  },

  /** Render drop down box for 7th+ runs */
  renderDropDown: function() {
    // Show a dropdown menu for the remaining runs
    if (this.props.status.runs.slice(6).length === 0) {
      return undefined;
    }
    return (
      <li className="dropdown">
        <a className="dropdown-toggle" data-toggle="dropdown">
          More runs <span className="caret"></span>
        </a>
        <ul className="dropdown-menu" role="menu">
          {
            this.props.status.runs.slice(6).map(function(run, index) {
              return (
                <li key={index}>
                  <a onClick={this.setCurrentTab.bind(this, run.runId)}>
                     Run {run.runId}
                  </a>
                </li>
              );
            }, this)
          }
        </ul>
      </li>
    );
  },

  /** Render current tab */
  renderCurrentTab: function() {
    // Empty string is the task tab
    if (this.state.currentTab === '') {
      return <TaskInfo status={this.props.status}/>;
    }
    // Check if we have the run in current tab
    var run = this.props.status.runs[this.state.currentTab];
    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong>&nbsp;
          The task does not seem to have the requested run...
        </div>
      );
    }

    // return a RunInfo
    return (
      <RunInfo
        status={this.props.status}
        run={run}
        ref="runInfo"/>
    );
  },

  // Set currentTab
  setCurrentTab: function(tab) {
    // Update state
    this.setState({
      currentTab:     tab
    });
  },

  // Tell child that we got an artifact created message
  handleArtifactCreatedMessage: function(message) {
    if (this.refs.runInfo) {
      this.refs.runInfo.handleArtifactCreatedMessage(message);
    }
  }
});

// Export TaskView
module.exports = TaskView;
