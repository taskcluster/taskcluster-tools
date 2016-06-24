import {
	FETCH_STATUS
} from '../actions/types';

export default function(state = null, action) {
  switch(action.type) {
		case FETCH_STATUS:
			return action.payload;
	}
	return state;
}
