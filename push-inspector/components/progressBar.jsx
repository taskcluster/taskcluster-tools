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
    // Not notify users that open an already completed build
    this.notifyFlag = false;

    this.progressBarClicked = this.progressBarClicked.bind(this);
  }

  /**
  * Set notify flag to false when changing taskGroupId so that
  * one does not get a web notification if a build is already done
  */
  componentDidUpdate(prevProps, prevState) { 
    if (prevProps.taskGroupId !== this.props.taskGroupId) {
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
    const status = ['failed', 'completed', 'running', 'pending', 'exception', 'unscheduled']
      .find(status => title.match(new RegExp(status + '*', 'ig')));
    
    if (status) {
      this.props.setActiveTaskStatus(status);
    }
  }

  /**
  * Seperate tasks in different arrays based on their current status
  */
  seperateTasksByState() {
    this.props.tasks.forEach((task) => {
      const status = task.status.state;

      if (this[status]) {
        this[status].push(task);
      }
    });
  }

  /**
  * Notify user if build is done
  */
  notifyCheck() { 
    const isBuildDone = !this.unscheduled.length && !this.running.length && !this.pending.length;
    const doNotify = this.notifyFlag && (this.completed.length || this.failed.length || this.exception.length);

    if(isBuildDone) {
      if(doNotify) {
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
    
    if (tasksRetrievedFully === true) {
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
      <bs.ProgressBar className="progressBar" onClick={this.progressBarClicked}>
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
    return (
      <div className={this.props.tasks.length ? '' : 'hideVisibility'}>
        {this.makeProgressBar()}
      </div>
    );
  }
}

export default connect(null, actions)(ProgressBar);
