const COLOR = {
  completed:    '#4ad24a',
  unscheduled:  '#abb0ab',
  scheduled:    '#77f077',
  failed:       '#ff4d5f',
  exception:    '#ecbe00'
};

var buildGraph = tasks => {

  if (!tasks) {
    return {};
  }

  var graph = {
    nodes: [],
    edges: []
  }, i=0, N = tasks.length;

  tasks.forEach(function (task) {
    graph.nodes.push(buildNode(task));
    task.dependents.forEach(function (dep) {
      graph.edges.push(buildEdge(task.taskId,dep));
    });
  });

  graph.nodes.forEach((node)=>{
    let angle = Math.PI * i/N;
    node.x = 100*Math.cos(angle);
    node.y = 100*Math.sin(angle);
    i++;
  });

  return graph;
}

/** Utility functions */
var buildNode = task => {
  return {
    id: task.taskId,
    label: task.name,
    x: 0,
    y: 0,
    size: 5 + 0.7*task.dependents.length,
    color: COLOR[task.state],
    originalColor: COLOR[task.state],
    borderWidth : task.dependents > 5? 4: 1 ,
    borderColor: task.satisfied? '#009402' :  '#e7cc25',
    originalBorderColor: task.satisfied? '#009402' :  '#e7cc25',
    rank: task.dependents.length,
    dependents: task.dependents
  }
}

var buildEdge = (taskId, depId) => {
  return {
    id:taskId+' '+depId,
    source: taskId,
    target: depId,
    type: "arrow",
    size: 50
  }
}

export default buildGraph;
