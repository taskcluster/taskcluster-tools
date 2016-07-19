import { FETCH_TASK } from '../actions/types';

export default function(state = null, action) {
  return action.type === FETCH_TASK ?
    action.payload :
    state;
};
