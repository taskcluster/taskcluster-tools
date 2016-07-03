import {
	FETCH_TASKS,
	CREATE_TASK,
	REMOVE_TASKS
} from '../actions/types';

export default function(state = [], action) {
	switch(action.type) {
		case FETCH_TASKS:
			console.log('Reducer: updating list of tasks to ...', action.payload);
			return action.payload;
		case REMOVE_TASKS:
			return action.payload;	
		case CREATE_TASK:
			return action.payload;

	}
	return state;
}