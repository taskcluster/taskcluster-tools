import { TASKS_RETRIEVED_FULLY } from '../actions/types';

export default (state = false, action) => action.type === TASKS_RETRIEVED_FULLY ?
  action.payload :
  state;
