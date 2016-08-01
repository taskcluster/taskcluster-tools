import { ACTIVE_TASK_STATUS } from '../actions/types';

const INITIAL_STATE = null;

export default function(state = INITIAL_STATE, action) {
  return action.type === ACTIVE_TASK_STATUS ? 
    action.payload : 
    state;
};
