import {
	FETCH_TASKS,
	CREATE_TASK
} from '../actions/types';

export default function(state = [], action) {
	switch(action.type) {
		case FETCH_TASKS:
			return action.payload;
		case CREATE_TASK:
			return action.payload;
	}
	return state;
}