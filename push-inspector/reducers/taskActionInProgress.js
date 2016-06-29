import {
	TASK_ACTIONS_IN_PROGRESS
} from '../actions/types';

export default function(state = null, action) {
  switch(action.type) {
		case TASK_ACTIONS_IN_PROGRESS:
			return action.payload;
	}
	return false;
}
