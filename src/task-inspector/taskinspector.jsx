import React from 'react';
import { findDOMNode } from 'react-dom';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import _ from 'lodash';
import TaskView from '../lib/ui/taskview';
import PreviousTasks from '../lib/ui/previoustasks';
import './taskinspector.less';

const VALID_INPUT = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

/** Renders the task-inspector with a control to enter `taskId` into */
export default React.createClass({
  displayName: 'TaskInspector',

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue and QueueEvents
      clients: {
        queue: taskcluster.Queue,
        queueEvents: taskcluster.QueueEvents
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys: ['taskId'],
      reloadOnLogin: false
    }),
    // Called handler when state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskIdInput: ['taskId']
      }
    }),
    // Listen for messages, reload bindings() when state.taskId changes
    utils.createWebListenerMixin({
      reloadOnKeys: ['taskId']
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['taskId'],
      type: 'string'
    })
  ],

  getInitialState() {
    return {
      taskId: '',
      statusLoaded: true,
      statusError: null,
      status: null,
      taskIdInput: ''
    };
  },

  /** Return promised state for TaskClusterMixin */
  load() {
    return this.state.taskId === '' ?
        // Skip loading empty-strings
      { status: null } :
        // Load task status and take the `status` key from the response
      { status: this.queue.status(this.state.taskId).then(_.property('status')) };
  },

  /** Return bindings for WebListenerMixin */
  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }

    // Construct the routing key pattern
    const routingKey = {
      taskId: this.state.taskId
    };

    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(routingKey),
      this.queueEvents.taskPending(routingKey),
      this.queueEvents.taskRunning(routingKey),
      this.queueEvents.artifactCreated(routingKey),
      this.queueEvents.taskCompleted(routingKey),
      this.queueEvents.taskFailed(routingKey),
      this.queueEvents.taskException(routingKey)
    ];
  },

  /** Handle message from listener */
  handleMessage(message) {
    // Update status structure
    this.setState({
      status: message.payload.status
    });

    // If the message origins from the artifact create exchange, we should
    // notify our children
    if (message.exchange === this.queueEvents.artifactCreated().exchange && this.refs.taskView) {
      this.refs.taskView.handleArtifactCreatedMessage(message);
    }
  },

  /** When taskId changed we should update the input */
  updateTaskIdInput() {
    this.setState({ taskIdInput: this.state.taskId });
  },

  render() {
    const invalidInput = !VALID_INPUT.test(this.state.taskIdInput);

    return (
      <div>
        <h1>Task Inspector</h1>
        <p>This tool lets you inspect a task given the <code>taskId</code></p>
        <form className="form-horizontal" onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-sm-8">
              <FormGroup validationState={invalidInput ? 'error' : null}>
                <ControlLabel className="col-sm-2">
                  <span>Enter <code>TaskId</code></span>
                </ControlLabel>
                <div className="col-sm-10">
                  <FormControl
                    type="text"
                    ref="taskId"
                    placeholder="taskId"
                    value={this.state.taskIdInput}
                    onChange={this.handleTaskIdInputChange}/>
                  <FormControl.Feedback />
                </div>
              </FormGroup>

              <div className="form-group">
                <div className="col-sm-offset-2 col-sm-10">
                  <input
                    type="submit"
                    className="btn btn-primary"
                    disabled={!this.state.statusLoaded || invalidInput}
                    value="Inspect task" />
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <PreviousTasks objectId={this.state.taskId} objectType="taskId" />
            </div>
          </div>
        </form>
        {
          this.renderWaitFor('status') || (this.state.status ?
            <TaskView ref="taskView" status={this.state.status} hashEntry={this.nextHashEntry()}/> :
            null
          )
        }
      </div>
    );
  },

  /** Update TaskIdInput to reflect input */
  handleTaskIdInputChange() {
    this.setState({
      taskIdInput: findDOMNode(this.refs.taskId).value.trim()
    });
  },

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({ taskId: this.state.taskIdInput });
  }
});
