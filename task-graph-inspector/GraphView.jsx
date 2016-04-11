import React from 'react'
import _ from 'lodash'

sigma.canvas.nodes.border = function (node, context, settings) {
  var prefix = settings('prefix') || '';
  context.fillStyle = node.color || settings('defaultNodeColor');
  context.beginPath();
  context.arc(
    node[prefix + 'x'],
    node[prefix + 'y'],
    node[prefix + 'size'],
    0,
    Math.PI * 2,
    true
  );

  context.closePath();
  context.fill();

  // Adding a border
  context.lineWidth = node.borderWidth || 1;
  context.strokeStyle = node.borderColor || '#fff';
  context.stroke();
}

export default class GraphView extends React.Component {
  constructor(props){
    super();
    this.props = props;
    // Bind functions
    this.refreshNodes = this.refreshNodes.bind(this);
    this.colorDependents = this.colorDependents.bind(this);
    this.runForceAtlas2 = this.runForceAtlas2.bind(this);
    this.clickNode = this.clickNode.bind(this);
    this.clickStage = this.clickStage.bind(this);

    this.sigma = new sigma({
      graph: props.graph,
      settings:{
        defaultNodeType: 'border'
      }
    });

    this.runForceAtlas2(props.forceAtlas2Timeout);

    this.sigma.bind('clickNode',this.clickNode);
    this.sigma.bind('clickStage',this.clickStage);
  }

  componentDidMount(){
    this.renderer = this.sigma.addRenderer({
      type:"canvas",
      container:"graph-container",
      labelThreshold:this.props.labelThreshold
    });

    this.sigma.refresh();
  }

  componentWillUnmount(){
    this.sigma.killRenderer(this.renderer);
  }

  render(){
    return <div id="graph-container"></div>
  }

  refreshNodes(){
    this.sigma.graph.nodes().forEach((node)=>{
      node.color = node.originalColor;
      node.borderColor = node.originalBorderColor;
    })
  }

  runForceAtlas2(timeout){
    this.sigma.startForceAtlas2({
      worker: true
    });

    setTimeout(()=>{
      this.sigma.stopForceAtlas2();
    },timeout|| 500);
  }

  colorDependents(centerNode){
    let dependents = centerNode.dependents, indices = [],index;
    this.sigma.graph.nodes().forEach((node)=>{
      if(node.id === centerNode.id){
        node.color = '#ADD8E6';
        node.borderColor = '#0000A0';
        return;
      }

      index = _.findIndex(dependents,(id)=>{return id === node.id} );

      if(index === -1){
        //Grey out the node
        node.color = '#d3d3d3';
        node.borderColor = '#a3a3a3';
      }else{
        // Color the node
        node.color = '#ADD8E6';
        node.borderColor = '#0000A0';
      }
    });
  }

  clickNode(e){
    this.props.clickNode(e.data.node.id);
    this.colorDependents(e.data.node);
    this.sigma.refresh();
  }

  clickStage(e){
    this.refreshNodes();
    this.sigma.refresh();
  }
}
