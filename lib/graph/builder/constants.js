const graphConst = {
  color: {
    completed:   '#4ad24a',
    unscheduled: '#abb0ab',
    scheduled:   '#77f077',
    failed:      '#ff4d5f',
    exception:   '#ecbe00'
  },

  borderColor: {
    TASK_SATISFIED:     '#009402',
    TASK_NOT_SATISFIED: '#e7cc25'
  },

  borderWidth : {
    LARGE: 5,
    SMALL: 1
  },

  size: {
    BASE:        5,
    MULTIPLIER:  0.7
  },

  RADIUS: 100
}


const nodeSize        = n => graphConst.size.BASE + n * graphConst.size.MULTIPLIER;

const nodeColor       = state => graphConst.color[state];

const nodeBorderColor = satisfied => {
  return satisfied ? graphConst.borderColor.TASK_SATISFIED : graphConst.borderColor.TASK_NOT_SATISFIED;
}

const nodeBorderWidth = n => n > 5 ? graphConst.borderWidth.LARGE : graphConst.borderWidth.SMALL;

const nodeX = angle => graphConst.RADIUS * Math.cos(angle);
const nodeY = angle => graphConst.RADIUS * Math.sin(angle);

var graphConstFunctions = {
  nodeSize,
  nodeColor,
  nodeBorderColor,
  nodeBorderWidth,
  nodeX,
  nodeY
};

export default graphConstFunctions;
