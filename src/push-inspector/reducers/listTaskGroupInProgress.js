import { LIST_TASKGROUP_IN_PROGRESS } from '../actions/types';

export default (state = false, action) => action.type === LIST_TASKGROUP_IN_PROGRESS ?
  action.payload :
  state;
