import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import {FormGroup, FormControl, ControlLabel, InputGroup, Button} from 'react-bootstrap';
import path from 'path';
import {TaskClusterEnhance, CreateWatchState} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import LoanerButton from '../lib/ui/loaner-button';

const VALID_INPUT = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

class OneClickLoaner extends Component {
  constructor(props) {
    super(props);

    this.state = {
      taskId: this.props.match.params.taskId || '',
      taskLoaded: true,
      taskError: null,
      task: null,
      taskIdInput: this.props.match.params.taskId || ''
    };

    this.updateTaskIdInput = this.updateTaskIdInput.bind(this);
    this.handleTaskIdInputChange = this.handleTaskIdInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
    this.onWatchReload = this.onWatchReload.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);
    document.addEventListener('watch-reload', this.onWatchReload, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
    document.removeEventListener('watch-reload', this.onWatchReload, false);
  }

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
    this.props.watchState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  onWatchReload({detail}) {
    detail.map(functionName => this[functionName]());
  }

  /** Return promised state for TaskClusterMixin */
  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // Skip loading empty-strings
    if (this.state.taskId === '') {
      const promisedState = {task: null};

      return this.props.loadState(promisedState);
    }

    // Reload task definition
    const promisedState = {task: this.props.clients.queue.task(this.state.taskId)};

    this.props.loadState(promisedState);
  }

  /** When taskId changed we should update the input */
  updateTaskIdInput() {
    this.setState({taskIdInput: this.state.taskId});
  }

  // Render a task-inspector
  render() {
    const invalidInput = !VALID_INPUT.test(this.state.taskIdInput);

    return (
      <div>
        <h4>One-Click Loaner</h4>
        <p>
          This tool lets you create an interactive task given a <code>taskId</code>.
        </p>
        <hr />
        <form onSubmit={this.handleSubmit}>
          <FormGroup validationState={invalidInput ? 'error' : null}>
            <ControlLabel>Task ID</ControlLabel>
            <InputGroup>
              <FormControl
                type="text"
                ref="taskId"
                placeholder="Enter a taskId"
                value={this.state.taskIdInput}
                onChange={this.handleTaskIdInputChange} />
              <InputGroup.Button>
                <Button type="submit">Submit</Button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </form>
        <br /><br />
        {!invalidInput && (
          <div className="text-center">
            {this.props.renderWaitFor('task') || (this.state.task && (
              <LoanerButton
                {...this.props}
                buttonStyle="primary"
                buttonSize="large"
                taskId={this.state.taskId}
                task={this.state.task} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /** Update TaskIdInput to reflect input */
  handleTaskIdInputChange() {
    const taskIdInput = findDOMNode(this.refs.taskId).value.trim();
    const invalidInput = !VALID_INPUT.test(taskIdInput);

    if (!invalidInput) {
      this.setState({
        taskIdInput,
        taskId: taskIdInput,
      });
    } else {
      this.setState({taskIdInput});
    }
  }

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({taskId: this.state.taskIdInput});
    this.props.history.push(path.join('/one-click-loaner', this.state.taskIdInput));
  }
}

const taskclusterOpts = {
  clients: {
    queue: taskcluster.Queue,
  },
  // Reload when state.taskId changes, ignore credential changes
  reloadOnKeys: ['taskId'],
  reloadOnLogin: false,
  name: OneClickLoaner.name
};

const watchStateOpts = {
  onKeys: {
    updateTaskIdInput: ['taskId'],
  }
};

export default TaskClusterEnhance(CreateWatchState(OneClickLoaner, watchStateOpts), taskclusterOpts);
