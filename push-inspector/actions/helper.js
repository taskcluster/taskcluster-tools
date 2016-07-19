import {
  TASK_ACTIONS_IN_PROGRESS,
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
  };
};

/**
* Render error message appropriately on a modal popup
*/
export const renderActionError = (err) => {
  return {  
    type: TASK_ACTIONS_ERROR,
    payload: rendering.renderError(err)
  };
};

/**
* Render success message appropriately on a modal popup
*/
export const renderActionSuccess = (successMessage) => {
  return {  
    type: TASK_ACTIONS_SUCCESS,
    payload: rendering.renderSuccess(successMessage)
  };
};

/**
* Create a task and append to list
*/
export const createTask = (list, dataObj) => {
  return {  
    type: CREATE_TASK,
    payload: dataObj
  };
};
