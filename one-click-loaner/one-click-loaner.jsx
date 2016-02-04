var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var LoanerButton    = require('../lib/ui/loaner-button');

var OneClickLoaner = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      clients: {
        queue:                taskcluster.Queue,
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys:           ['taskId'],
      reloadOnLogin:          false,
    }),
    // Called handler when state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskIdInput:    ['taskId']
      }
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['taskId'],
      type:                   'string'
    })
  ],

  getInitialState() {
    return {
      taskId:         '',
      taskLoaded:     true,
      taskError:      undefined,
      task:           null,
      taskIdInput:    ''
    };
  },

  /** Return promised state for TaskClusterMixin */
  load() {
    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return {task: null};
    }
    // Reload task definition
    return {
      task: this.queue.task(this.state.taskId),
    };
  },

  /** When taskId changed we should update the input */
  updateTaskIdInput() {
    this.setState({taskIdInput: this.state.taskId});
  },

  // Render a task-inspector
  render() {
    // Render
    var invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(this.state.taskIdInput);
    return (
      <span>
      <h1>Create Interactive Task from Task</h1>
      <p>
        This tool lets you create an interactive task given a
        <code>taskId</code>
      </p>
      <form className="form-horizontal" onSubmit={this.handleSubmit}>
        <bs.Input
          type="text"
          ref="taskId"
          placeholder="taskId"
          value={this.state.taskIdInput}
          label={<span>Enter <code>TaskId</code></span>}
          bsStyle={invalidInput ? 'error' : null}
          onChange={this.handleTaskIdInputChange}
          hasFeedback
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
      </form>
      <br/><br/>
      {
        (!invalidInput ? (
        <center>
          {
            this.renderWaitFor('task') || (this.state.task ? (
              <LoanerButton
                buttonStyle="primary"
                buttonSize="large"
                taskId={this.state.taskId}
                task={this.state.task}/>
            ) : (
              undefined
            ))
          }
        </center>
        ) : undefined)
      }
      </span>
    );
  },

  /** Update TaskIdInput to reflect input */
  handleTaskIdInputChange() {
    let taskIdInput = this.refs.taskId.getInputDOMNode().value.trim();
    this.setState({taskIdInput});
    var invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(taskIdInput);
    if (!invalidInput) {
      this.setState({taskId: taskIdInput});
    }
  },

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({taskId: this.state.taskIdInput});
  }
});

// Export OneClickLoaner
module.exports = OneClickLoaner;
