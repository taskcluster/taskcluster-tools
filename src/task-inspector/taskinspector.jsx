import React from 'react';
import { findDOMNode } from 'react-dom';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import { Form, FormGroup, FormControl, ControlLabel, Row, Col, InputGroup, Button }
  from 'react-bootstrap';
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
      <div style={{ marginBottom: 40 }}>
        <h4>Task Inspector</h4>
        <p>
          Given a <code>taskId</code>, The task inspector lets you load, monitor, and inspect the
          state, runs, artifacts, definition, and logs of a task as it is evaluated. You can also
          use this tool to download private artifacts.
        </p>
        <hr />

        <Row>
          <Col sm={8}>
            <Form onSubmit={this.handleSubmit}>
              <FormGroup validationState={invalidInput ? 'error' : null}>
                <ControlLabel>Task ID</ControlLabel>
                <InputGroup>
                  <FormControl
                    type="text"
                    ref="taskId"
                    placeholder="Enter taskId, e.g. 8U3xVyssSBuinaXwRgJ_qQ"
                    value={this.state.taskIdInput}
                    onChange={this.handleTaskIdInputChange} />
                  <InputGroup.Button>
                    <Button type="submit" disabled={!this.state.statusLoaded || invalidInput}>
                      Inspect Task
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </Form>
          </Col>

          <Col sm={4} style={{ marginTop: '25px' }}>
            <PreviousTasks objectId={this.state.taskId} objectType="taskId" />
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            {this.renderWaitFor('status') || (this.state.status ? (
                <TaskView
                  ref="taskView"
                  status={this.state.status}
                  hashEntry={this.nextHashEntry()}/>
              ) :
              null
            )}
          </Col>
        </Row>
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
