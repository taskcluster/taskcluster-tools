import {
	TASK_ACTIONS_IN_PROGRESS,
	TASKS_NOT_AVAILABLE,
	TASK_ACTIONS_ERROR,
	TASK_ACTIONS_SUCCESS,
	CREATE_TASK,
	FETCH_TASK
} from './types';

import { rendering } from '../lib/utils';


/**
* Set to true when any of task actions are called
* Task actions include Scheduling, Retriggering,
* Canceling, Purging, Edit and Create, One-Click loaner
*/
export const taskActionsInProgress = (isExecuting) => {
	return {	
		type: TASK_ACTIONS_IN_PROGRESS,
		payload: isExecuting
	}
}

/**
* Will show a message to the user if set to true
* Message will say that taskGroupId does not exist
*/
export const taskGroupIdNotAvailable = (bool) => {
	return {	
		type: TASKS_NOT_AVAILABLE,
		payload: bool
	}
}

/**
* Render error message appropriately on a modal popup
*/
export const renderActionError = (err) => {
	return {	
		type: TASK_ACTIONS_ERROR,
		payload: rendering.renderError(err)
	}
}

/**
* Render success message appropriately on a modal popup
*/
export const renderActionSuccess = (successMessage) => {
	return {	
		type: TASK_ACTIONS_SUCCESS,
		payload: rendering.renderSuccess(successMessage)
	}
}

/**
* Create a task and append to list
*/
export const createTask = (list, dataObj) => {
	return {	
		type: CREATE_TASK,
		payload: list.concat(dataObj)
	}
}









