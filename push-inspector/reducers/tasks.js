import {
	FETCH_TASKS_IN_STEP,
	FETCH_TASKS_FULLY,
	CREATE_TASK,
	REMOVE_TASKS
} from '../actions/types';

export default function(state = [], action) {

	switch(action.type) {
		
		case FETCH_TASKS_IN_STEP:
			return [...state, ...action.payload];	

		case FETCH_TASKS_FULLY:
			return action.payload;	

		case REMOVE_TASKS:
			return action.payload;	

		case CREATE_TASK:
			return [ ...state, ...action.payload ];
	}
	
	return state;
}