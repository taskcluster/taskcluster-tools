import {
  TASK_ACTIONS_ERROR,
  TASK_ACTIONS_SUCCESS,
  CLEAR_TASKS_ACTIONS_MESSAGE
} from '../actions/types';

export default (state = null, action) => {
  switch (action.type) {
    case TASK_ACTIONS_ERROR:
    case TASK_ACTIONS_SUCCESS:
      return action.payload;

    case CLEAR_TASKS_ACTIONS_MESSAGE:
      return null;

    default:
      return state;
  }
};
