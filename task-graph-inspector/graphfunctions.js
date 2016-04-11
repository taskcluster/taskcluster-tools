var COLOR = {
  completed: '#4ad24a',
  unscheduled: '#abb0ab',
  scheduled: '#77f077',
  failed: '#ff4d5f',
  exception: '#ecbe00'
}
var buildGraph = function (tasks) {

  if(!tasks){
    return {};
  }

  var graph = {
    nodes: [],
    edges: []
  }, i=0, N = tasks.length;

  tasks.forEach(function (task) {
    graph.nodes.push(buildNode(task,i/N));
    i++;
    task.dependents.forEach(function (dep) {
      graph.edges.push(buildEdge(task.taskId,dep));
    });
  });

  return graph;
}

var buildClusters = (tasks, numberOfClusters)=>{
  var nodes = [], clusters = {};
  tasks.forEach((task)=>{
    nodes.push(buildNode(task));
  });
  nodes = _.orderBy(nodes,['rank'],['desc']);
  _.slice(nodes,0,numberOfSubgraphs).forEach((startNode)=>{
    var graph = {
      nodes: [],
      edges: []
    };
    graph.nodes = search(nodes,startNode);
    graph = buildSubgraph(graph.nodes);
    clusters[startNode.id] = graph;
  });
  var rem = _.filter(nodes,(node)=>{return !node.assigned});
  clusters['rem'] = buildSubgraph(rem);
  return family;
}

/** Utility functions */

var search = (mainList,start)=>{

  start.assigned = start.id;
  var nodes = [],q =[],groupId = start.id, index;

  nodes.push(start);
  if(start.dependents === []){
    return;
  }
  // BFS to find all dependents
  _.concat(q,start.dependents);
  while(q!==[]){
    index = _.findIndex(mainList,q[0]);
    _.drop(q);
    if(index === -1){
      continue;
    }
    if(mainList[index].assigned){
      nodes.push({
        id:mainList[index].id,
        type: "assigned",
        assigned: mainList[index].assigned
      });
      continue;
    }
    _.concat(mainList[index].dependents);
    mainList[index].assigned = groupId;
    nodes.push(mainList[index]);
  }

  return nodes;

}

var buildSubgraph = (nodes)=>{
  var graph = {
    nodes: nodes,
    edges: []
  }, index;
  nodes.forEach((node)=>{
    node.dependents.forEach((dep)=>{
      edges.push(buildNode(node.id,dep))
    });
  });
  assignPositions(graph.nodes);
  return graph;
}

var buildNode = (task,ratio)=>{
  return {
    id: task.taskId,
    label: task.name,
    x: 100*Math.cos(Math.PI * ratio),
    y: 100*Math.sin(Math.PI * ratio),
    size: 5 + 0.7*task.dependents.length,
    color: COLOR[task.state],
    originalColor: COLOR[task.state],
    borderWidth : 4+0.2*task.dependents.length,
    borderColor: task.satisfied? '#009402' :  '#e7cc25',
    originalBorderColor: task.satisfied? '#009402' :  '#e7cc25',
    rank: task.dependents.length,
    dependents: task.dependents
  }
}

var assignPositions = (nodes)=>{
  var i = 0, N = nodes.length;
  nodes.forEach((node)=>{
    node.x = 100*Math.cos(Math.PI * i/N);
    node.y = 100*Math.sin(Math.PI * i/N);
  });
}

var buildEdge = (taskId,depId)=>{
  return {
    id:taskId+' '+depId,
    source: taskId,
    target: depId,
    type: "arrow",
    size: 50
  }
}

export default buildGraph;
