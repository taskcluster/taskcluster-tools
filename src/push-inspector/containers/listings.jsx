import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Table from './table';
import { queueEvents, webListener, notifications } from '../lib/utils';
import _ from 'lodash';

class Listings extends Component {
  constructor(props) {
    super(props);

    this.listener = null;
    this.bQueue = [];
    this.loop = null;

    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
  * Handle message from listener
  */
  handleMessage(message) {
    const { taskId } = this.props.params;

    // Handle Error
    if (message instanceof Error) {
      // Set state to error true
      this.props.setDashboardBanner(message);
      return;
    }

    // Find queue exchanges
    const queueExchanges = [
      queueEvents.taskDefined().exchange,
      queueEvents.taskPending().exchange,
      queueEvents.taskRunning().exchange,
      queueEvents.artifactCreated().exchange,
      queueEvents.taskCompleted().exchange,
      queueEvents.taskFailed().exchange,
      queueEvents.taskException().exchange
    ];

    if (_.includes(queueExchanges, message.exchange)) {
      // Append message to buffer queue
      this.bQueue.push(message);

      // Update active task if taskId match with message update
      if (taskId && taskId === message.payload.status.taskId) {
        this.props.fetchTask(taskId);
        this.props.fetchStatus(taskId);

        if (message.exchange === queueEvents.artifactCreated().exchange) {
          this.props.fetchArtifacts(taskId);
        }
      }

      // Handle edge cases that will increase UX
      this.handleEdgeCases(message);
    }
  }

  /**
  * Handle special cases
  */
  handleEdgeCases(message) {
    const { fetchTask, fetchStatus, params } = this.props;
    const { taskId } = params;

    // Give priority to exceptions to show without waiting for loop to happen
    if (message.exchange === queueEvents.taskException().exchange) {
      notifications.notifyUser('Task exception');
    }

    if (message.exchange === queueEvents.taskFailed().exchange) {
      notifications.notifyUser('Task failure');
    }
  }

  /**
  * Construct loop that will update the tasks when messages arrive from the web listener
  */
  constructLoopForMessages() {
    const { fetchTask, fetchStatus, params, fetchTasksInSteps } = this.props;
    const { taskId, taskGroupId } = params;

    this.loop = setInterval(() => {
      if (this.bQueue.length) {
        this.bQueue = [];
        fetchTasksInSteps(taskGroupId, false);
      }
    }, 5000);
  }

  /**
  * Clear interval, stop weblistener, etc.
  */
  cleanup() {
    clearInterval(this.loop);
    this.loop = null;
    webListener.stopListening();
    this.props.removeTasks();
  }

  /**
  * Make appropriate setup
  */
  setup() {
    notifications.requestPermission();
    webListener.startListening(this.props.params.taskGroupId, this.handleMessage);
    this.props.activeTaskGroupId(this.props.params.taskGroupId);
  }

  /**
  * Remove the list of tasks that were previously loaded
  */
  componentWillUnmount() {
    this.cleanup();
    this.props.removeTasks();
  }

  componentDidUpdate(prevProps) {
    // Clean up + setup when user changes taskGroupId
    if (prevProps.params.taskGroupId !== this.props.params.taskGroupId) {
      this.cleanup();
      this.setup();
    }

    // Setup loop
    if (this.props.tasksRetrievedFully && !this.loop) {
      this.constructLoopForMessages();
    }
  }

  /**
  * Fetch list of tasks and start the web listener
  */
  componentWillMount() {
    const { taskGroupId } = this.props.params;

    if (!this.props.listTaskGroupInProgress) {
      this.props.fetchTasksInSteps(taskGroupId, true);
    }

    this.setup();

    if (this.props.tasksRetrievedFully && !this.loop) {
      this.constructLoopForMessages();
    }
  }

  render() {
    return (
      <div>
        <div className="col-xs-6 left-panel">
          <Table />
        </div>
        <div className="col-xs-6 right-panel">
          {this.props.children}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ tasks, tasksRetrievedFully, listTaskGroupInProgress }) => (
  { tasks, tasksRetrievedFully, listTaskGroupInProgress }
);

export default connect(mapStateToProps, actions)(Listings);
