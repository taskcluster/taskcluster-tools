import {ACTIVE_TASK_STATUS} from '../actions/types';

const INITIAL_STATE = null;

export default (state = INITIAL_STATE, action) => action.type === ACTIVE_TASK_STATUS ?
  action.payload :
  state;
