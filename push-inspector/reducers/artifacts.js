import {
	FETCH_ARTIFACTS
} from '../actions/types';

export default function(state = [], action) {
	switch(action.type) {
		case FETCH_ARTIFACTS:
			console.log('action.payload artifacts: ', action.payload);
			return action.payload;
	}
	return state;
}
