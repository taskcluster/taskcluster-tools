import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as bs from 'react-bootstrap';
import { notifications } from '../lib/utils';

class ProgressBar extends Component {

  constructor(props) {
    super(props);

    this.completed = [];
    this.failed = [];
    this.exception = [];
    this.unscheduled = [];
    this.pending = [];
    this.running = [];

    // Flag used so that it doesn't notify users that open an already
    // completed build
    this.notifyFlag = false;

    this.progressBarClicked = this.progressBarClicked.bind(this);
  }

  /**
  * Set notify flag to false when changing taskGroupId so that
  * one does not get a web notification if a build is already done
  */
  componentDidUpdate(prevProps, prevState) {
    
    if(prevProps.taskGroupId !== this.props.taskGroupId) {
      this.notifyFlag = false;
    }    
  }

  /**
  * Reset states
  */
  emptyStates() {
    
    this.completed = [];
    this.failed = [];
    this.exception = [];
    this.unscheduled = [];
    this.pending = [];
    this.running = [];

  }

  /**
  * Progress bar on click handler
  */
  progressBarClicked(event) {
    const title = event.target.title;

    if(title.match(/Failed*/g)) {
      this.props.setActiveTaskStatus("failed");
    } else if (title.match(/Completed*/g)) {
      this.props.setActiveTaskStatus("completed");
    } else if (title.match(/Running*/g)) {
      this.props.setActiveTaskStatus("running");
    } else if (title.match(/Pending*/g)) {
      this.props.setActiveTaskStatus("pending");
    } else if(title.match(/Exception*/g)) {
      this.props.setActiveTaskStatus("exception");
    } else if(title.match(/Unscheduled*/g)) {
      this.props.setActiveTaskStatus("unscheduled");
    }
  }

  /**
  * Seperate tasks in different arrays based on their current status
  */
  seperateTasksByState() {
    const { tasks } = this.props;

    tasks.map((task) => {
      status = task.status.state;
      switch (status) {
        case "completed": this.completed.push(task); break;
        case "failed": this.failed.push(task); break;
        case "exception": this.exception.push(task); break;
        case "unscheduled": this.unscheduled.push(task); break;
        case "pending": this.pending.push(task); break;
        case "running": this.running.push(task); break;
      }
    });

  }

  /**
  * Notify user if build is done
  */
  notifyCheck() {
    
    const uLength = this.unscheduled.length;
    const rLength = this.running.length;
    const pLength = this.pending.length;
    const cLength = this.completed.length;
    const eLength = this.exception.length;
    const fLength = this.failed.length;

    // Having no unscheduled and no running and no pending tasks
    // means build is done
    if(uLength === 0 && rLength === 0 && pLength === 0) {
      if(this.notifyFlag == true && (cLength > 0 || fLength > 0 || eLength > 0)) {
        notifications.notifyUser('Build done');
        // Stop notifying further
        this.notifyFlag = false;  
      }
    // Set notify flag when build is not done  
    } else {
      this.notifyFlag = true;
    }
  }

  /**
  * Render progress bar
  */
  makeProgressBar() {
    
    let tasks = this.props.tasks;
    let status;
    let totLen = tasks.length;
    let complPerc;
    let failedPerc;
    let excepPerc;
    let unschPerc;
    let runPerc;
    let penPerc;
    let loadingLabel = '...';
    let threshold = 5;
    let totWeighted;

    const { tasksRetrievedFully, taskId } = this.props;

    // reset component statuses
    this.emptyStates();

    this.seperateTasksByState();
    
    if(tasksRetrievedFully === true) {
      this.notifyCheck();  
    }
    
    // original percentages
    complPerc = this.completed.length / totLen * 100;
    failedPerc = this.failed.length / totLen * 100;
    excepPerc = this.exception.length / totLen * 100;
    unschPerc = this.unscheduled.length / totLen * 100;
    runPerc = this.running.length / totLen * 100;
    penPerc = this.pending.length / totLen * 100;

    // intermediate values 
    complPerc = (complPerc < threshold && complPerc > 0) ? threshold : complPerc;
    failedPerc = (failedPerc < threshold && failedPerc > 0) ? threshold : failedPerc;
    excepPerc = (excepPerc < threshold && excepPerc > 0) ? threshold : excepPerc;
    unschPerc = (unschPerc < threshold && unschPerc > 0) ? threshold : unschPerc;
    penPerc = (penPerc < threshold && penPerc > 0) ? threshold : penPerc;
    runPerc = (runPerc < threshold && runPerc > 0) ? threshold : runPerc;

    // common weighted denominator
    totWeighted = complPerc + failedPerc + excepPerc + unschPerc + runPerc + penPerc;

    const getWeightedPercentage = (value) => {
      return value / totWeighted * 100;
    };

    // weighted percentages
    complPerc = getWeightedPercentage(complPerc);
    failedPerc = getWeightedPercentage(failedPerc);
    excepPerc = getWeightedPercentage(excepPerc);
    unschPerc = getWeightedPercentage(unschPerc);
    penPerc = getWeightedPercentage(penPerc);
    runPerc = getWeightedPercentage(runPerc);

    return (
      <bs.ProgressBar className="progressBar" onClick={this.progressBarClicked} >
        <bs.ProgressBar title={`Completed (${this.completed.length})`} className="label-completed"   now={complPerc} key={1} label={!!this.completed.length ? `C (${this.completed.length})`: loadingLabel} />          
        <bs.ProgressBar title={`Running (${this.running.length})`} className="label-running active"  striped now={runPerc} key={2} label={!!this.running.length ? `R (${this.running.length})` : loadingLabel} />                    
        <bs.ProgressBar title={`Pending (${this.pending.length})`} className="label-pending"   now={penPerc} key={3} label={!!this.pending.length ? `P (${this.pending.length})` : loadingLabel} />
        <bs.ProgressBar title={`Unscheduled (${this.unscheduled.length})`} className="label-unscheduled"   now={unschPerc} key={4} label={!!this.unscheduled.length ? `U (${this.unscheduled.length})` : loadingLabel} />
        <bs.ProgressBar title={`Exception (${this.exception.length})`} className="label-exception"   now={excepPerc} key={5} label={!!this.exception.length ? `E (${this.exception.length})` : loadingLabel} />
        <bs.ProgressBar title={`Failed (${this.failed.length})`} className="label-failed"   now={failedPerc} key={6} label={!!this.failed.length ? `F (${this.failed.length})` : loadingLabel} />
      </bs.ProgressBar>
    );
  }

  render() {
    const { taskGroupId, tasks } = this.props;
    return (
      <div className={!!tasks.length ? "" : "hideVisibility"}>
        {this.makeProgressBar()}
      </div>
    );
  }

}

export default connect(null, actions)(ProgressBar)

