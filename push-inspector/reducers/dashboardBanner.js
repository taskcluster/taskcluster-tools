import { SET_DASHBOARD_BANNER } from '../actions/types';

export default function(state = false, action) {
  return action.type === SET_DASHBOARD_BANNER ?
  	action.payload :
  	state;
};
