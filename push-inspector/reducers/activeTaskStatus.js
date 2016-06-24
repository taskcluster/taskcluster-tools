import {
	ACTIVE_TASK_STATUS
} from '../actions/types';

const INITIAL_STATE = null;
export default function(state = INITIAL_STATE, action) {
	switch(action.type) {
		case ACTIVE_TASK_STATUS:
			return action.payload;
	}
	return state;
}
