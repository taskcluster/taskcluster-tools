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
    
    this.bTimer = null;
    this.bQueue = [];

    this.handleMessage = this.handleMessage.bind(this);

  }

  /** Close Listener connection */
  stopListening() {
    webListener.stopListening();
  }
  /** Start Listener connection */
  startListening(taskGroupId, onMessageAction) {
    webListener.startListening(taskGroupId, onMessageAction);
  }

  /** Handle message from listener */
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
      this.handleQueueMessage(message);
    }
 
  }

  getTimeRemaining(endtime) {
    var t = Date.parse(endtime) - Date.parse(new Date());
    var seconds = Math.floor( (t/1000) % 60 );
    var minutes = Math.floor( (t/1000/60) % 60 );
    var hours = Math.floor( (t/(1000*60*60)) % 24 );
    var days = Math.floor( t/(1000*60*60*24) );
    return {
      'total': t,
      'days': days,
      'hours': hours,
      'minutes': minutes,
      'seconds': seconds
    };
  }


  /** Handle message from the queue */
  handleQueueMessage(message) {
    const { params, fetchArtifacts, fetchTasks, fetchTask, fetchStatus } = this.props;
    const { taskId, taskGroupId } = params;
    const durationToWait = 5;
    let toExtract = 10;

    // babel makes 'this' to be undefined inside arrow functions, hence the use of 'that'
    let that = this;

    //  Case where messages stop coming and won't be able to make the required calls
    const edgeCase = () => {
      let flag = false;
      return function() {
        if(flag = false) {
          flag = true;
          console.log('setting a timer...');
          setTimeout(() => {            
            if(that.bQueue.length > 0) {
              update();
              flag = false;
            }
          }, durationToWait * 1000);
        }
      }
    }

    const update = () => {
      // up to toExtract calls from the buffer
      while(true) {
        toExtract -= 1;
        let elem = that.bQueue.shift();

        // Update Task
        if(taskId) {   
          updateTask(elem);
        }

        // Update tasks list if and only if on the last turn of the loop
        if(!(that.bQueue.length > 0 && toExtract > 0)) {
          console.log('updating tasks lists');
          updateTasksList();
          return;  
        }      
      }
    }

    const updateTask = (elem) => {
      if(elem.exchange == queueEvents.artifactCreated().exchange) {
        fetchArtifacts(taskId);
        return;
      }

      fetchTask(taskId);
      fetchStatus(taskId);
    }

    const updateTasksList = () => {
      fetchTasks(taskGroupId);
    }


    // Append message to buffer queue
    this.bQueue.push(message);
       
    // Create a date with current time
    if(this.bTimer == null) {
      this.bTimer = new Date();

    // Check if 'durationToWait' seconds has elapsed  
    } else if(new Date(new Date() - this.bTimer).getSeconds() >= durationToWait) {
      console.log('5 seconds have elapsed');
      // Stop timer
      this.bTimer = null;
      update();    
    }
    edgeCase();              
  }

  /** Remove the list of tasks that were previously loaded */
  componentWillUnmount() {
      this.props.removeTasks();
      this.stopListening();
  }

  /** Handle case where taskGroupId is changed */
  componentDidUpdate(prevProps, prevState) {
    if(prevProps.params.taskGroupId != this.props.params.taskGroupId) {
      webListener.stopListening();
      this.stopListening();
      this.startListening(this.props.params.taskGroupId, this.handleMessage);
    }
  }

  /** Fetch list of tasks and start the web listener */
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

export default connect(mapStateToProps, actions)(Listings)
