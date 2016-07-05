import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Table from './table';
import { queueEvents, webListener } from '../lib/utils';
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
  * Close Listener connection 
  */
  stopListening() {
    webListener.stopListening();
  }

  /** 
  * Start Listener connection 
  */
  startListening(taskGroupId, onMessageAction) {
    webListener.startListening(taskGroupId, onMessageAction);
  }

  /** 
  * Handle message from listener 
  */
  handleMessage(message) {

    // Handle Error
    if(message instanceof Error) { 
      // Set state to error true
      this.props.setDashboardBanner(true);
      return;
    }

    // Find queue exchanges
    let queueExchanges = [
      queueEvents.taskDefined().exchange,
      queueEvents.taskPending().exchange,
      queueEvents.taskRunning().exchange,
      queueEvents.artifactCreated().exchange,
      queueEvents.taskCompleted().exchange,
      queueEvents.taskFailed().exchange,
      queueEvents.taskException().exchange
    ];
    // Dispatch to handleQueueMessage or handleSchedulerMessage
    if (_.includes(queueExchanges, message.exchange)) {
      // Append message to buffer queue
      this.bQueue.push(message);
      // Handle edge cases that will increase UX
      this.handleEdgeCases(message);     
    }
 
  }

  /**
  * Give priority to exceptions to show without waiting for loop to happen
  */
  handleEdgeCases(message) {
    const { fetchTask, fetchStatus, params } = this.props;
    const { taskId } = params;
    if(message.exchange == queueEvents.taskException().exchange) {
      fetchTask(taskId);
      fetchStatus(taskId);
    }
  }


  /**
  * Construct loop that will update the tasks when messages arrive from the web listener 
  */
  constructLoopForMessages() {

    const { fetchArtifacts, fetchTask, fetchStatus, params, fetchTasksInSteps } = this.props;
    const { taskId, taskGroupId } = params;
  
    this.loop = setInterval(() => {
      if(this.bQueue.length > 0) {
        this.bQueue = [];
        fetchTasksInSteps(taskGroupId, false);  
      }      
    }, 5000);
  }

  /**
  * Clear interval, stop weblistener, etc.
  */
  cleanup() {
    console.log('CLEANING UP');
    clearInterval(this.loop);
    this.loop = null;
    this.stopListening();
  }

  /**
  * Make appropriate setup
  */
  setup() {
    console.log('SETTING UP');
    this.startListening(this.props.params.taskGroupId, this.handleMessage);
  }

  /** 
  * Remove the list of tasks that were previously loaded 
  */
  componentWillUnmount() {
      this.props.removeTasks();
      this.cleanup();
  }

  componentDidUpdate(prevProps, prevState) {
    
    // Case when user change taskGroupId
    if(prevProps.params.taskGroupId != this.props.params.taskGroupId) {    
      // Cleanup
      this.cleanup();   
      // Start listening
      this.setup();
    }

    // Setup loop
    if(this.props.tasksRetrievedFully == true && !!!this.loop) {
      console.log('constructLoopForMessages CALLED ');
      this.constructLoopForMessages();
    }

  }

  /** Fetch list of tasks and start the web listener */
  componentWillMount() {
    const { taskGroupId, taskId } = this.props.params;
    this.props.fetchTasksInSteps(taskGroupId, true);
    this.startListening(taskGroupId, this.handleMessage);
    this.constructLoopForMessages();
  }

  render() {
    const tasks = this.props.tasks;

    return (
      <div>
        <div className="col-md-6  ">
          <Table />
        </div>
        <div className="col-md-6">
          {this.props.children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tasks: state.tasks,
    status: state.status,
    tasksRetrievedFully: state.tasksRetrievedFully
  }
}

export default connect(mapStateToProps, actions)(Listings)
