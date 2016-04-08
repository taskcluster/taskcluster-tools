var taskcluster = require('taskcluster-client');
var utils = require('../lib/utils');
var React = require('react');
var GraphView = require('./GraphView');
var bs = require('react-bootstrap');
var _ = require('lodash');

var COLOR = [];
COLOR.push('rgb(200,10,10)');
COLOR.push('rgb(10,200,10)');

var buildGraph = function(task){
  //build an adjacency matrix based on the task list
  var graph = {
    nodes: [],
    edges: []
  }
  /*
  * Temporarily set the size and coordinates as random
  */
  tasks.forEach(function (task) {
    var t = task.task, s=task.status;
    //Add nodes
    graph.nodes.push({
      id: s.taskId,
      size: 10,
      x: Math.random(),
      y: Math.random(),
      color: COLOR[Math.round(Math.random()*2)]
    });
    //Add edges
    t.dependencies.forEach(function (dep) {
      grap.edges.push({
        id: s.taskId+' '+dep,
        source: dep,
        target: s.taskId,
        color : COLOR[0]
      });
    });
  });

  return graph;
}


var TaskGraphVisualizer = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue
      },
      reloadOnKeys: ['taskGraphId'],
      reloadOnLogin:false
    }),

    utils.createWatchStateMixin({
      onKeys:{
        updateTaskGraphIdInput: ['taskGraphId']
      }
    }),

    utils.createLocationHashMixin({
      keys: ['taskGraphId','taskId'],
      type: 'string'
    })
  ],

  getInitialState: function () {
    return {
      taskGraphId : '',
      taskGraphIdInput: '',
      tasks : [],
      tasksError : null,
      tasksLoaded: true
    }
  },

  load: function () {
    if(this.state.taskGraphId === ''){
      return {
        tasks: []
      }
    }

    var tasks = [], t;

    t = this.queue.listTaskGroup(this.state.taskGraphId);
    do {
      _.concat(tasks,t);
      if(!t.continuationToken){
        break;
      }
      t = this.queue.listTaskGroup(this.state.taskGraphId, {continuationToken: t.continuationToken});
    } while (t.continuationToken);

    return {
      tasks: tasks
    };
  },

  renderForm: function () {
    var invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(this.state.taskGraphIdInput);
    return (
      <form className="form-horizontal" onSubmit={this.handleSubmit}>
        <div className="list">
          <bs.Input
            ref = "taskGraphId"
            placeholder = "taskGraphId"
            value = {this.state.taskGraphIdInput}
            onChange = {this.handleTaskGraphIdInputChange}
            />
          <input type = "submit" disabled = {invalidInput}/>
        </div>
      </form>
    );
  },

  render: function () {
    var s = new sigma({
      graph: buildGraph(this.state.tasks)
    });
    return (
      <div>
        <div>
          {this.renderForm()}
        </div>
        <GraphView sigma={s} camera = {null} />
      </div>
    );
  },

  handleTaskGraphIdInputChange: function() {
    this.setState({
      taskGraphIdInput:   this.refs.taskGraphId.getInputDOMNode().value.trim()
    });
  },

  handleSubmit: function(e) {
    e.preventDefault();
    this.setState({taskGraphId: this.state.taskGraphIdInput});
  },

  updateTaskGraphIdInput: function () {
    this.setState({taskGraphIdInput:this.state.taskGraphId});
  }
})

module.exports = TaskGraphVisualizer;
