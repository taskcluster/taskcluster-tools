import {TASK_ACTIONS_IN_PROGRESS,
  TASK_ACTIONS_ERROR,
  TASK_ACTIONS_SUCCESS,
  CREATE_TASK,
} from './types';

/**
* Set to true when any of task actions are called
* Task actions include Scheduling, Retriggering,
* Canceling, Purging, Edit and Create, One-Click loaner
*/
export const taskActionsInProgress = isExecuting => ({
  type: TASK_ACTIONS_IN_PROGRESS,
  payload: isExecuting,
});

/**
* Render error message appropriately on a modal popup
*/
export const renderActionError = err => ({
  type: TASK_ACTIONS_ERROR,
  payload: err,
});

/**
* Render success message appropriately on a modal popup
*/
export const renderActionSuccess = successMessage => ({
  type: TASK_ACTIONS_SUCCESS,
  payload: successMessage,
});

/**
* Create a task and append to list
*/
export const createTask = (list, task) => ({
  type: CREATE_TASK,
  payload: task,
});
