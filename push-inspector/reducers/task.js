import {
	FETCH_TASK
} from '../actions/types';

export default function(state = null, action) {
  console.log('action: ', action);
  switch(action.type) {
		case FETCH_TASK:
			return action.payload;
	}
	return state;
}
