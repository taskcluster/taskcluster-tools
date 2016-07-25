import { ACTIVE_TASK_GROUP_ID } from '../actions/types';

export default function(state = null, action) {
  return action.type === ACTIVE_TASK_GROUP_ID ?
    action.payload :
    state;
};
