import {ACTIVE_TASK_GROUP_ID} from '../actions/types';

export default (state = null, action) => action.type === ACTIVE_TASK_GROUP_ID ?
  action.payload :
  state;
