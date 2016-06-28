import {
	TASK_ACTIONS_ERROR,
	TASK_ACTIONS_SUCCESS
} from '../actions/types';

export default function(state = null, action) {
	switch(action.type) {
		case TASK_ACTIONS_ERROR:
			return action.payload;

		case TASK_ACTIONS_SUCCESS:
			return action.payload;
	}
	return state;
}
