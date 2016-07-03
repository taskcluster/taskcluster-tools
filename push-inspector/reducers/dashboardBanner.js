import {
	SET_DASHBOARD_BANNER
} from '../actions/types';

export default function(state = false, action) {
  console.log('action: ', action);
  switch(action.type) {
		case SET_DASHBOARD_BANNER:
			return action.payload;
	}
	return state;
}
