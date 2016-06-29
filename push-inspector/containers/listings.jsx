import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
//import ProgressBar from '../components/progressBar';
import Table from './table';
import taskcluster from 'taskcluster-client';
import { queueEvents, webListener } from '../lib/utils';
import _ from 'lodash';


class Listings extends Component {

  constructor(props) {
    super(props);
    this.listener = null;
    this.webListener = webListener();

    this.handleMessage = this.handleMessage.bind(this);
  }

  // Close Listener connection
  stopListening() {
    this.webListener.stopListening();
  }

  startListening(taskGroupId, onMessageAction) {
    
    this.webListener.startListening(taskGroupId, onMessageAction);
  }

  /** Handle message from listener */
  handleMessage(message) {
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
      this.handleQueueMessage(message);
    }
 
  }

  /** Handle message from the queue */
  handleQueueMessage(message) {
    console.log('handleQueueMessage: ', message);
    const { params, fetchArtifacts, fetchTasks, fetchTask, fetchStatus } = this.props;
    const { taskId, taskGroupId } = params;
    if(message.exchange == queueEvents.artifactCreated().exchange) {
      fetchArtifacts(taskId);
      return;
    }

    fetchTasks(taskGroupId);
    fetchTask(taskId);
    fetchStatus(taskId);

  }



  //  Remove the list of tasks that were previously loaded
  componentWillUnmount() {
      this.props.removeTasks();
      this.stopListening();
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.params.taskGroupId != this.props.params.taskGroupId) {
      this.webListener.stopListening();
      this.stopListening();
      this.startListening(this.props.params.taskGroupId, this.handleMessage);
    }
  }

  componentWillMount() {
    const { taskGroupId, taskId } = this.props.params;
    this.props.fetchTasks(taskGroupId);
    this.startListening(taskGroupId, this.handleMessage);
  }

  render() {
    const tasks = this.props.tasks;
    return (
      <div>
        <div className="col-xs-6  ">
          <Table />
        </div>
        <div className="col-xs-6">
          {this.props.children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tasks: state.tasks,
    status: state.status
  }
}

export default connect(mapStateToProps, actions )(Listings)
