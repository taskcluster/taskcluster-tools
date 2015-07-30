var $ = require('jquery');
var qs = require('querystring');
var request = require('superagent-promise');
var Promise = require('promise');

$(async () => {
  let url = 'https://goldiewilson-onepointtwentyone-1.c.influxdb.com:8087/db/docker-worker/series';
  let start = 'now() - 5m';
  let end = 'now()';
  let res = await request.get(url).query({
    u: 'efficiency',
    p: 'uit8cx',
    q: 'select * from capacity_over_time where time > ' + start + ' and time < ' + end
  }).end();
  console.log(res.status);
  let queryResult = JSON.parse(res.text)[0];
  console.log(queryResult);

  let utilized = 0;
  let total = 0;
  let idleMachineTime = 0;
  let totalMachineTime = 0;

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
  }
  console.log(utilized / total);
  console.log(1 - idleMachineTime / totalMachineTime);
});

window.myDebug = require('debug');

//$('#container')[0]