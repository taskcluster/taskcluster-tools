import {
	SET_DASHBOARD_BANNER
} from '../actions/types';

export default function(state = false, action) {
  switch(action.type) {
		case SET_DASHBOARD_BANNER:
			return action.payload;
	}
	return state;
}
