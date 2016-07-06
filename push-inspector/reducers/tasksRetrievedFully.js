import {
	TASKS_RETRIEVED_FULLY
} from '../actions/types';

export default function(state = false, action) {
	switch(action.type) {
		case TASKS_RETRIEVED_FULLY:
			return action.payload;
	}
	return state;
}
