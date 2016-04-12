import _ from 'lodash'

//Very simple clustering...club dependents into a single unit
const clusters = (graph)=>{

}

const removeIndependentNodes = (graph)=>{
  var nodes = [], edges=[], index;

  graph.edges.map((edge)=>{
    edges.push(edge.target);
    edges.push(edge.source);
  });

  edges = _.uniq(edges);
  edges.forEach((edge)=>{
    index = _.findIndex(graph.nodes,(node)=>{return node.id === edge});
    if(index!==-1){
      nodes.push(graph.nodes[index]);
    }
  });

  return {
    nodes: nodes,
    edges: graph.edges
  }
}

const findIndependentNodes = (graph)=>{
  var nodes = [], edges=[], index;

  graph.edges.map((edge)=>{
    edges.push(edge.target);
    edges.push(edge.source);
  });

  edges = _.uniq(edges);
  edges.forEach((edge)=>{
    index = _.findIndex(graph.nodes,(node)=>{return node.id === edge});
    if(index!==-1){
      nodes.push(graph.nodes[index]);
    }
  });
  return _.difference(graph.nodes,nodes);
}

export { removeIndependentNodes, findIndependentNodes };

var buildEdge = (taskId,depId)=>{
  return {
    id:taskId+' '+depId,
    source: taskId,
    target: depId,
    type: "arrow",
    size: 50
  }
}
