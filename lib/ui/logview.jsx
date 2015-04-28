var React           = require('react');
var _               = require('lodash');
var taskcluster     = require('taskcluster-client');
var utils           = require('../utils');
var DropdownList    = require('react-widgets').DropdownList;
var TerminalView    = require('./terminalview');

/** Render a terminal and a dropdown menu to select logs from */
var LogView = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue:                taskcluster.Queue
      }
    })
  ],

  // Get initial state
  getInitialState: function() {
    var entry = _.find(this.props.logs, {name: 'public/logs/terminal.log'}) ||
                _.find(this.props.logs, {name: 'public/logs/live.log'}) ||
                this.props.logs[0];
    return {
      name:       (entry ? entry.name : undefined)   // URL to show
    }
  },

  // Validate properties
  propTypes: {
    logs:     React.PropTypes.array.isRequired,
    taskId:   React.PropTypes.string.isRequired,
    runId:    React.PropTypes.oneOfType([
                React.PropTypes.string,
                React.PropTypes.number
              ]).isRequired
  },

  // Fresh the log at request of the user
  refreshLog: function() {
    this.refs.termView.refresh();
  },

  render: function() {
    // Create URL for the artifact
    var logUrl;
    if (this.state.name) {
      logUrl = this.queue.buildUrl(
        this.queue.getArtifact,
        this.props.taskId,
        this.props.runId,
        this.state.name
      );
    }

    return (
      <span>
      <dl className="dl-horizontal log-view">
        <dt>Show Log</dt>
        <dd>
          <div className="log-view-log-chooser">
            <div className="log-view-dropdown-wrapper">
              <DropdownList
                data={this.props.logs}
                value={this.state.name}
                onChange={this.handleLogChanged}
                textField='name'
                valueField='name'/>
            </div>
            <button type="button"
                    className="btn btn-sm btn-default log-view-btn-refresh"
                    onClick={this.refreshLog}>
              <i className="glyphicon glyphicon-refresh"></i>
            </button>
          </div>
        </dd>
      </dl>
      <TerminalView url={logUrl} ref="termView"/>
      </span>
    );
  },

  /** Handle select changes in drop down box */
  handleLogChanged: function(log) {
    this.setState({name: log.name});
  }
});

// Export LogView
module.exports = LogView;
