let $ = require('jquery');
var bs = require('react-bootstrap');
let Promise = require('promise');
let qs = require('querystring');
var React = require('react');
let request = require('superagent-promise');

async function update(start, end, user, pass, workerType) {
  let url = 'https://goldiewilson-onepointtwentyone-1.c.influxdb.com:8087/db/docker-worker/series';
  let res = await request.get(url).query({
    u: user,
    p: pass,
    q: 'select * from capacity_over_time where time > ' + start + ' and time < ' + end +
    (workerType !== '' ? ' and workerType = \'' + workerType + '\'' : '')
  }).end();
  console.log(res.status);
  let queryResult = JSON.parse(res.text)[0];

  let utilized = 0;
  let total = 0;
  let idleMachineTime = 0;
  let totalMachineTime = 0;
  let totalDuration = 0;

  let columns = queryResult.columns;
  let runningIndex = columns.indexOf('runningTasks');
  let idleIndex = columns.indexOf('idleCapacity');
  let totalIndex = columns.indexOf('totalCapacity');
  let durationIndex = columns.indexOf('duration');

  for (let point of queryResult.points) {
    utilized += point[runningIndex] * point[durationIndex];
    total += point[totalIndex] * point[durationIndex];
    totalMachineTime += point[durationIndex];
    if (point[idleIndex] === point[totalIndex]) {
      idleMachineTime += point[durationIndex];
    }
    totalDuration += point[durationIndex];
  }
  document.getElementById('result').innerHTML =
    (utilized / total * 100).toFixed(2) +
    '% of total capacity is being used over the time period, ie efficiency<br>' +
    ((1 - idleMachineTime / totalMachineTime) * 100).toFixed(2) + 
    '% of workers are doing something over the time period<br>' +
    (totalDuration / 1000 / 3600).toFixed(2) + ' hours of total worker time was spent';
}

var Efficiency = React.createClass({
  render: function () {
    return(
      <span>
      <h1>Efficiency calculator</h1>
      <p>This tool lets approximates the efficiency of docker-worker over 
      a certain period of time.</p>
      <form className="form-horizontal" onSubmit={this.handleSubmit} id="form">
        <bs.Input
          type="text"
          ref="user"
          placeholder="influxDB username"
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <bs.Input
          type="text"
          ref="pass"
          placeholder="influxDB password"
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <bs.Input
          type="text"
          ref="start"
          placeholder="start time"
          defaultValue="now() - 1d"
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <bs.Input
          type="text"
          ref="end"
          placeholder="end time"
          defaultValue="now()"
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <bs.Input
          type="text"
          ref="workerType"
          placeholder="workerType, if a specific workerType is desired"
          defaultValue=""
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <input type="submit"
                   className="btn btn-primary"
                   value="Query!"/>
          </div>
        </div>
      </form>
      <p id="result">
      </p>
      </span>
    );
  },
  /** Handle form submission */
  handleSubmit: function(e) {
    e.preventDefault();
    //TODO: figure out what to put in state
    //this.setState({taskId: this.state.taskIdInput});
    // console.log(document.getElementById("form").elements[0].value);
    // console.log(document.getElementById("form").elements[1].value);
    update(this.refs.start.getValue(),
      this.refs.end.getValue(),
      this.refs.user.getValue(),
      this.refs.pass.getValue(),
      this.refs.workerType.getValue());
  }
});

module.exports = Efficiency;

