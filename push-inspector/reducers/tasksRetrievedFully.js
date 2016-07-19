import { TASKS_RETRIEVED_FULLY } from '../actions/types';

export default function(state = false, action) {
  return action.type === TASKS_RETRIEVED_FULLY ?
  	action.payload :
  	state;
};
