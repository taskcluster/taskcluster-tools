import { TASK_ACTIONS_IN_PROGRESS } from '../actions/types';

export default (state = null, action) => action.type === TASK_ACTIONS_IN_PROGRESS ?
  action.payload :
  false;
