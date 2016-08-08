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
    // Don't notify users that open an already completed build
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
    const title = event.target.innerText.toLowerCase();
    const status = ['failed', 'completed', 'running', 'pending', 'exception', 'unscheduled']
      .find(status => title.includes(status[0]));
    
    if (status) {
      this.props.setActiveTaskStatus(status);
    }
  }

  /**
  * Separate tasks in different arrays based on their current status
  */
  separateTasksByState() {
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

    if (isBuildDone) {
      if (doNotify) {
        notifications.notifyUser('Build done');
        // Stop notifying further
        this.notifyFlag = false;  
      }
    } else {
      // Set notify flag when build is not done  
      this.notifyFlag = true;
    }
  }

  /**
  * Render progress bar
  */
  makeProgressBar() { 
    const { tasks, taskId, tasksRetrievedFully } = this.props;
    const total = tasks.length;
    const threshold = 5;

    this.emptyStates();
    this.separateTasksByState();

    if (tasksRetrievedFully) {
      this.notifyCheck();
    }

    const groups = [
      'completed',
      'failed',
      'exception',
      'unscheduled',
      'running',
      'pending'
    ];

    const percents = groups.map((group) => {
      const percent = this[group].length / total * 100;

      return percent < threshold && percent > 0 ? threshold : percent;
    });

    const weightedTotal = percents.reduce((total, current) => total + current, 0);
    const getWeightedPercent = (value) => value / weightedTotal * 100;
    const toTitle = (group) => {
      const name = group.charAt(0).toUpperCase() + group.slice(1);

      return `${name} (${this[group].length})`;
    };

    return (
      <div onClick={this.progressBarClicked}>
        <bs.ProgressBar className="progressBar">
          {groups.map((group, index) => {
            const subtasks = this[group];
            const className = group === 'running' ? `label-${group} active` : `label-${group}`;
            const title = toTitle(group);
            const label = subtasks.length ? `${title[0]}(${subtasks.length})` : '...';

            return (
              <bs.ProgressBar
                key={index}
                title={title}
                className={className}
                now={getWeightedPercent(percents[index])}
                label={label} />
            );
          })}
        </bs.ProgressBar>
      </div>
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
