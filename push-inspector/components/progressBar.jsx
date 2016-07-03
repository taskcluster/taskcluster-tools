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
          loadingLabel = '...',
          threshold = 5,
          totWeighted;


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


    // original percentages
    complPerc = completed.length / totLen * 100;
    failedPerc = failed.length / totLen * 100;
    excepPerc = exception.length / totLen * 100;
    unschPerc = unscheduled.length / totLen * 100;
    runPerc = running.length / totLen * 100;
    penPerc = pending.length / totLen * 100;


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
        <bs.ProgressBar onClick={this.progressBarClicked} style={{height: '35px'}}>
          <bs.ProgressBar title={`Completed (${completed.length})`} className="label-completed" striped  now={complPerc} key={1} label={!!completed.length ? `C (${completed.length})`: loadingLabel} />          
          <bs.ProgressBar title={`Running (${running.length})`} className="label-running active"  striped now={runPerc} key={5} label={!!running.length ? `R (${running.length})` : loadingLabel} />                    
          <bs.ProgressBar title={`Pending (${pending.length})`} className="label-pending" striped  now={penPerc} key={6} label={!!pending.length ? `P (${pending.length})` : loadingLabel} />
          <bs.ProgressBar title={`Unscheduled (${unscheduled.length})`} className="label-unscheduled" striped  now={unschPerc} key={4} label={!!unschPerc ? `U (${unscheduled.length})` : loadingLabel} />
          <bs.ProgressBar title={`Exception (${exception.length})`} className="label-exception"  striped now={excepPerc} key={3} label={!!exception.length ? `E (${exception.length})` : loadingLabel} />
          <bs.ProgressBar title={`Failed (${failed.length})`} className="label-failed"  striped now={failedPerc} key={2} label={!!failed.length ? `F (${failed.length})` : loadingLabel} />
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
