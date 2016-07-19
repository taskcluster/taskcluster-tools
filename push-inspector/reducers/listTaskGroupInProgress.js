import { LIST_TASKGROUP_IN_PROGRESS } from '../actions/types';

export default function(state = false, action) {
  return action.type === LIST_TASKGROUP_IN_PROGRESS ?
  	action.payload :
  	state;
};
