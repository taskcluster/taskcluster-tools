import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';

export default class ProgressBar extends Component {

  constructor(props) {
    super(props);
    this.progressBarClicked = this.progressBarClicked.bind(this);
  }

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

  makeProgressBar() {

    let		completed = [],
					failed = [],
					exception = [],
					unscheduled = [],
					pending = [],
					running = [],
          tasks = this.props.tasks,
          status,
          totLen = tasks.length,
          complPerc,
          failedPerc,
          excepPerc,
          unschPerc,
          runPerc,
          penPerc,
          loadingLabel = '...';


		tasks.map((task) => {
			status = task.status.state;
			switch (status) {
				case "completed": completed.push(task); break;
				case "failed": failed.push(task); break;
				case "exception": exception.push(task); break;
				case "unscheduled": unscheduled.push(task); break;
				case "pending": pending.push(task); break;
				case "running": running.push(task); break;
			}
		});


    complPerc = completed.length / totLen * 100;
    failedPerc = failed.length / totLen * 100;
    excepPerc = exception.length / totLen * 100;
    unschPerc = unscheduled.length / totLen * 100;
    runPerc = running.length / totLen * 100;
    penPerc = pending.length / totLen * 100;


		return (
        <bs.ProgressBar onClick={this.progressBarClicked} style={{height: '35px'}}>
          <bs.ProgressBar title={`Completed (${completed.length})`} className="label-completed" striped  now={complPerc} key={1} label={!!complPerc ? `${complPerc.toFixed(0)}%`: loadingLabel} />          
          <bs.ProgressBar title={`Running (${running.length})`} className="label-running active"  striped now={runPerc} key={5} label={!!runPerc ? `${runPerc.toFixed(0)}%` : loadingLabel} />
          <bs.ProgressBar title={`Failed (${failed.length})`} className="label-failed"  striped now={failedPerc} key={2} label={!!failedPerc ? `${failedPerc.toFixed(0)}%` : loadingLabel} />
          <bs.ProgressBar title={`Exception (${exception.length})`} className="label-exception"  striped now={excepPerc} key={3} label={!!excepPerc ? `${excepPerc.toFixed(0)}%` : loadingLabel} />
          <bs.ProgressBar title={`Pending (${pending.length})`} className="label-pending" striped  now={penPerc} key={6} label={!!penPerc ? `${penPerc.toFixed(0)}%` : loadingLabel} />
          <bs.ProgressBar title={`Unscheduled ${unscheduled.length})`} className="label-unscheduled" striped  now={unschPerc} key={4} label={!!unschPerc ? `${unschPerc.toFixed(0)}%` : loadingLabel} />
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
