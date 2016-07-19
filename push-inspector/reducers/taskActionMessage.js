import {
  TASK_ACTIONS_ERROR,
  TASK_ACTIONS_SUCCESS,
  CLEAR_TASKS_ACTIONS_MESSAGE
} from '../actions/types';

export default function(state = null, action) {
  switch (action.type) {
    case TASK_ACTIONS_ERROR:
    case TASK_ACTIONS_SUCCESS:
    case CLEAR_TASKS_ACTIONS_MESSAGE:
      return action.payload
    default:
      return state;
  }
};
