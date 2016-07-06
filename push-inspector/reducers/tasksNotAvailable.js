import {
	TASKS_NOT_AVAILABLE
} from '../actions/types';

export default function(state = false, action) {
	switch(action.type) {
		case TASKS_NOT_AVAILABLE:
			return action.payload;
	}
	return state;
}