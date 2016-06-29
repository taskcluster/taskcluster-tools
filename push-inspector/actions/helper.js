import {
	TASK_ACTIONS_IN_PROGRESS
} from './types';
// This function should be called when a task action is called
// isExecuting should be set to true if the call is about to get initiated
// isExecuting should be set to false if the call has resolved
export function taskActionsInProgress(isExecuting) {
	console.log('inside task action call');
	return {	
		type: TASK_ACTIONS_IN_PROGRESS,
		payload: isExecuting
	}
}