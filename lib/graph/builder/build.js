import graphConst from './constants.js';

var buildGraph = tasks => {

  if (!tasks) {
    return {};
  }

  let graph = {
    nodes: [],
    edges: []
  };
  let i = 0;
  let N = tasks.length;

  tasks.forEach(function (task) {
    graph.nodes.push(buildNode(task));
    task.dependents.forEach(function (dep) {
      graph.edges.push(buildEdge(task.taskId,dep));
    });
  });

  graph.nodes.forEach((node)=>{
    let angle = Math.PI * i/N;
    node.x = graphConst.nodeX(angle);
    node.y = graphConst.nodeY(angle);
    i++;
  });

  return graph;
}

/** Utility functions */
var buildNode = task => {
  let color = graphConst.nodeColor(task.state),
    borderColor = graphConst.nodeBorderColor(task.satisfied);
  return {
    id:                   task.taskId,
    label:                task.name,
    x:                    0,
    y:                    0,
    size:                 graphConst.nodeSize(task.dependents.length),
    color:                color,
    originalColor:        color,
    borderWidth :         graphConst.nodeBorderWidth(task.dependents.length) ,
    borderColor:          borderColor,
    originalBorderColor:  borderColor,
    rank:                 task.dependents.length,
    dependents:           task.dependents
  };
}

var buildEdge = (taskId, depId) => {
  return {
    id:     taskId+' '+depId,
    source: taskId,
    target: depId,
    type:   'arrow',
    size:   50
  };
}

export default buildGraph;
