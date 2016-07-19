import { FETCH_ARTIFACTS } from '../actions/types';

export default function(state = [], action) {
  return action.type === FETCH_ARTIFACTS ?
  	action.payload :
  	state;
};
