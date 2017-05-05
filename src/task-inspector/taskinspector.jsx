import React from 'react';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import TaskView from '../lib/ui/taskview';
import {TaskClusterEnhance, CreateWebListener, CreateWatchState} from '../lib/utils';
import {findDOMNode} from 'react-dom';
import path from 'path';
import Helmet from 'react-helmet';
import {Form, FormGroup, FormControl, ControlLabel, Row, Col, InputGroup, Button}
  from 'react-bootstrap';
import PreviousTasks from '../lib/ui/previoustasks';

const VALID_INPUT = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

class TaskInspector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      taskIdInput: '',
      statusLoaded: true,
      statusError: null,
      status: null
    };

    this.handleTaskIdInputChange = this.handleTaskIdInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.bindings = this.bindings.bind(this);
    this.onListenerMessage = this.onListenerMessage.bind(this);
    this.onTaskClusterReload = this.onTaskClusterReload.bind(this);
    this.onWatchStateReload = this.onWatchStateReload.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  /** Setup required event listeners for HOC */
  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.addEventListener('listener-message', this.onListenerMessage, false);
    document.addEventListener('watch-reload', this.onWatchStateReload, false);

    // Send props to CreateWatchState. Invoked to trigger on mount.
    this.props.watchStateProps(this.props);
  }

  /** Use TaskClusterEnhance to load taskId */
  load() {
    const taskId = this.props.match.params.taskId || '';

    const promisedState = {status: this.props.clients.queue.status(taskId).then(_.property('status'))};

    this.props.loadState(promisedState);
  }

  /** Send new props to CreateWatchState */
  componentDidUpdate(prevProps, prevState) {
    // Send props to CreateWatchState
    this.props.watchStateProps(this.props);
  }

  onTaskClusterReload() {
    this.load();
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  onWatchStateReload({detail}) {
    detail.map(functionName => this[functionName]());
  }

  onListenerMessage({detail}) {
    // Update status structure
    this.setState({status: detail.payload.status});

    // If the message origins from the artifact create exchange, we should
    // notify our children
    if (detail.exchange === this.props.clients.queueEvents.artifactCreated().exchange && this.refs.taskView) {
      this.refs.taskView.handleArtifactCreatedMessage(detail);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.removeEventListener('listener-message', this.onListenerMessage, false);
    document.removeEventListener('watch-reload', this.onWatchStateReload, false);
  }


  bindings() {
    const taskId = this.props.match.params.taskId;

    // Don't bother listening for empty strings, they're pretty boring
    if (!taskId) {
      return [];
    }

    // Construct the routing key pattern
    const routingKey = {taskId};

    // Return all interesting bindings
    return [
      this.props.clients.queueEvents.taskDefined(routingKey),
      this.props.clients.queueEvents.taskPending(routingKey),
      this.props.clients.queueEvents.taskRunning(routingKey),
      this.props.clients.queueEvents.artifactCreated(routingKey),
      this.props.clients.queueEvents.taskCompleted(routingKey),
      this.props.clients.queueEvents.taskFailed(routingKey),
      this.props.clients.queueEvents.taskException(routingKey),
    ];
  }


  getTitle() {
    if (this.refs.taskView && this.refs.taskView.state.task) {
      return this.refs.taskView.state.task.metadata.name;
    }

    return 'Task Inspector';
  }

  /** When taskId changes, we should update the input */
  updateTaskIdInput() {
    this.setState({taskIdInput: this.props.match.params.taskId});
  }

  render() {
    const taskIdInput = this.state.taskIdInput;
    const taskId = this.props.match.params.taskId;
    const invalidInput = !VALID_INPUT.test(taskIdInput);

    return (
      <div style={{marginBottom: 40}}>
        <Helmet title={this.getTitle()} />
        <h4>My Component TaskInspector</h4>
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
                    value={taskIdInput}
                    onChange={this.handleTaskIdInputChange} />
                  <InputGroup.Button>
                    <Button type="submit" disabled={taskId === taskIdInput || invalidInput}>
                      Inspect Task
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </Form>
          </Col>

          <Col sm={4} style={{marginTop: '25px'}}>
            <PreviousTasks objectId={taskId} objectType="taskId" />
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            {
              taskId && this.props.renderWaitFor('status') || (this.state.status && (
                <TaskView
                  ref="taskView"
                  status={this.state.status}
                  {...this.props} />
              ))
            }
          </Col>
        </Row>
      </div>
    )
  }

  /** Update taskIdInput to reflect input */
  handleTaskIdInputChange() {
    this.setState({taskIdInput: findDOMNode(this.refs.taskId).value.trim()});
  }

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();

    this.props.history.push(path.join('/', 'task-inspector', this.state.taskIdInput));
  }
}


const taskclusterOpts = {
  // Need updated clients for Queue and QueueEvents
  clients: {
    queue: taskcluster.Queue,
    queueEvents: taskcluster.QueueEvents
  },
  // Reload when props.match.params.taskId changes, ignore credential changes
  reloadOnKeys: ['taskId'],
  reloadOnLogin: false
};

// Listen for messages, reload bindings() when state.taskId changes
const webListenerOpts = {
  reloadOnKeys: ['taskId']
};

// Called handler when match.params.taskId changes
const watchStateOpts = {
  onKeys: {
    updateTaskIdInput: ['taskId']
  }
};

export default TaskClusterEnhance(CreateWatchState(CreateWebListener(TaskInspector, webListenerOpts), watchStateOpts), taskclusterOpts);
