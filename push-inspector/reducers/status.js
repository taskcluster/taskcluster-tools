import { FETCH_STATUS } from '../actions/types';

export default function(state = null, action) {
  return action.type === FETCH_STATUS ?
  	action.payload :
  	state;
};
