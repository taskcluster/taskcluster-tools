import { TASK_ACTIONS_IN_PROGRESS } from '../actions/types';

export default function(state = null, action) {
  return action.type === TASK_ACTIONS_IN_PROGRESS ?
    action.payload :
    false;
};
