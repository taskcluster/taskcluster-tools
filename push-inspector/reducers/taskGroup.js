import {
  ACTIVE_TASK_GROUP_ID,
} from '../actions/types';

export default function(state = null, action) {
  switch(action.type) {
    case ACTIVE_TASK_GROUP_ID:
      return action.payload;
  }
  return state;
}
