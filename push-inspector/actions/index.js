import {
  FETCH_TASKS_IN_STEP,
  FETCH_TASKS_FULLY,
  REMOVE_TASKS,
  FETCH_TASK,
  FETCH_STATUS,
  ACTIVE_TASK_STATUS,
  FETCH_ARTIFACTS,
  SET_DASHBOARD_BANNER,
  TASKS_RETRIEVED_FULLY,
  CLEAR_TASKS_ACTIONS_MESSAGE,
  ACTIVE_TASK_GROUP_ID,
  LIST_TASKGROUP_IN_PROGRESS
} from './types';

// Helper functions
import { 
  taskActionsInProgress,
  renderActionSuccess,
  renderActionError,
  createTask
} from './helper';
import { rendering } from '../lib/utils';
import { queue } from '../lib/utils';

// Modules
import taskcluster from 'taskcluster-client';
import slugid from 'slugid';
import _ from 'lodash';
import { hashHistory } from 'react-router';

/**
* Get the list of tasks in small steps
* Set limitBool to true if you want to fetch in steps
* Set to false otherwise
*/
export const fetchTasksInSteps = (taskGroupId, limitBool) => {
  let options = {};
  let token = null;
  let res = null;
  const limit = 200;
  console.log('will start fetching...');
  
  return async (dispatch, getState) => {
    dispatch(listTaskGroup(true));
    while (true) {  
      // Set continuationToken if there is a token 
      if (token) { 
        options.continuationToken = token; 
      }
      
      // Set limit on tasks if there is one
      if (limitBool == true) { 
        options.limit = limit; 
      }
      
      try {   
        res = await queue.listTaskGroup(taskGroupId, options);              
        let tasks = res.tasks;
        
        // do not dispatch if taskGroupId changed sometime between the start and end of the async request
        if (taskGroupId !== getState().taskGroup) {
          return;
        }

        // Dispatch tasks
        dispatch({
          type: limitBool ? FETCH_TASKS_IN_STEP : FETCH_TASKS_FULLY,
          payload: tasks
        });

        // Flag to indicate whether list has been loaded
        dispatch(tasksHaveBeenRetrieved(!res.continuationToken));

      // taskGroupId not found  
      } catch (err) {
        dispatch(setDashboardBanner(err));
      } finally {
        if (res) {
          token = res.continuationToken;  
        }
        
        if (!token) {          
          break;
        }

        dispatch(listTaskGroup(false));
      }     
    } 
  };
};

/** 
* Get task definition
*/
export const fetchTask = (taskId) => {
  return async (dispatch) => {
    try {
      let task = await queue.task(taskId);
      dispatch({
        type: FETCH_TASK,
        payload: task
      });
    } catch(err) {
      dispatch(setDashboardBanner(err));
    }   
  };
};

/** 
* Get artifacts list
*/
export const fetchArtifacts = (taskId) => {
  return async (dispatch) => {
    try {
      let res = await queue.listLatestArtifacts(taskId);
      dispatch({
        type: FETCH_ARTIFACTS,
        payload: res.artifacts
      });
    } catch(err) {
      console.log(`Run Not Found!  The task ${taskId} does not seem to have the requested run...`);
    }   
  };
};

/**
* Remove list of tasks
*/
export const removeTasks = () => {
  return {
    type: REMOVE_TASKS,
    payload: []
  };
};

/**
* Get task status
*/
export const fetchStatus = (taskId) => {
  return async (dispatch) => {
    try {
      let res = await queue.status(taskId);
      let status = res.status;

      dispatch({
        type: FETCH_STATUS,
        payload: status
      });
    } catch(err) {
      dispatch(setDashboardBanner(err));
    }   
  };
};

/**
* Set status of a task (e.g, pending)
*/
export const setActiveTaskStatus = (status) => {
  return {
    type: ACTIVE_TASK_STATUS,
    payload: status
  };
};

/**
* Set active taskGroupId
*/
export const activeTaskGroupId = (taskGroupId) => {
  return {
    type: ACTIVE_TASK_GROUP_ID,
    payload: taskGroupId
  };
};

/**
* Purge a task
*/
export const purge = (provisionerId, workerType, selectedCaches, successMessage) => {   
  let purgeCache;

  // Setup purgeCache
  purgeCache = new taskcluster.PurgeCache(
    localStorage.credentials ? 
    { credentials: JSON.parse(localStorage.credentials) }
    : undefined
  );

  const cachesPromise = Promise
    .all(selectedCaches.map(cacheName => {
      return purgeCache.purgeCache(provisionerId, workerType, { cacheName });
    }));

  return (dispatch) => {
    dispatch(taskActionsInProgress(true));
    cachesPromise
      .then((data) => {
        dispatch(renderActionSuccess(successMessage))
        dispatch(taskActionsInProgress(false));
      })
      .catch((err) => {
        dispatch(renderActionError(err))
        dispatch(taskActionsInProgress(false));
      });
  };
};

/**
* Retrigger a task
*/
export const retriggerTask = (list, toClone, successMessage) => { 
  const taskId = slugid.nice();
  const task = _.cloneDeep(toClone);
  const now = Date.now();
  const created = Date.parse(task.created);

  task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
  task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
  task.created = new Date(now).toJSON();
  task.retries = 0;

  return async (dispatch) => {
    dispatch(taskActionsInProgress(true));

    try {
      let res = await queue.createTask(taskId, task);
      let dataObj = { task, status: res.status };
      
      hashHistory.push(`${task.taskGroupId}/${res.status.taskId}`);
      // Update current list of tasks
      dispatch(createTask(list, dataObj));
      // Update modal message
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    } 
  };
};

/**
* Cancel a task
*/
export const cancelTask = (taskId, successMessage) => {   
  return async (dispatch) => {
    dispatch(taskActionsInProgress(true));

    try {
      let res = await queue.cancelTask(taskId);
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    } 
  };
};

/**
* Schedule a task
*/
export const scheduleTask = (taskId, successMessage) => {     
  return async (dispatch) => {
    dispatch(taskActionsInProgress(true));

    try {
      let res = await queue.scheduleTask(taskId);
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    } 
  };
};

/**
* Edit and create task 
*/
export const editAndCreateTask = (oldTask, successMessage) => {
  let newTask = {
    // filled in by task creator on load
    created: null,
    deadline: null,
  };
  // copy fields from the parent task, intentionally excluding some
  // fields which might cause confusion if left unchanged
  const exclude = [
    'routes',
    'taskGroupId',
    'schedulerId',
    'priority',
    'created',
    'deadline',
    'dependencies',
    'requires'
  ];
  
  _.keys(oldTask).forEach(key => {
    if (!_.includes(exclude, key)) {
      newTask[key] = oldTask[key];
    }
  });

  // overwrite task-creator's local state with this new task
  localStorage.setItem('task-creator/task', JSON.stringify(newTask));

  // ..and go there
  window.open(`${location.protocol}//${location.host}/task-creator`);

  // Update modal message
  return renderActionSuccess(successMessage);
};

/**
* One Click Loaner action
*/
export const loanerCreateTask = (list, id, toClone, successMessage) => {  
  const taskId = slugid.nice();
  const task = _.cloneDeep(toClone);

  // Strip routes
  delete task.routes;

  task.payload.env = task.payload.env || {};
  task.payload.env.TASKCLUSTER_INTERACTIVE = 'true';

  // Strip artifacts
  delete task.payload.artifacts;

  // Strip dependencies and requires
  delete task.dependencies;
  delete task.requires;

  // Set interactive = true
  task.payload.features = task.payload.features || {};
  task.payload.features.interactive = true;

  // Strip caches
  delete task.payload.caches;

  // Update maxRunTime
  task.payload.maxRunTime = Math.max(
    task.payload.maxRunTime,
    3 * 60 * 60
  );

  // Update timestamps
  task.deadline = taskcluster.fromNowJSON('12 hours');
  task.created = taskcluster.fromNowJSON();
  task.expires = taskcluster.fromNowJSON('7 days');

  // Set task,retries to 0
  task.retries = 0;

  return async (dispatch) => {
    dispatch(taskActionsInProgress(true));

    try {  
      let res = await queue.createTask(taskId, task);
      const dataObj = { task, status: res.status };
      const location = window.location;
     
      hashHistory.push(`${task.taskGroupId}/${res.status.taskId}`);
      window.open(`${location.protocol}//${location.host}/one-click-loaner/connect/#${res.status.taskId}`);
      
      // Update current list of tasks
      dispatch(createTask(list, dataObj));
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    } 
  };
};

/**
* Set dashboard banner
*/
export const setDashboardBanner = (msg) => {   
  return {
    type: SET_DASHBOARD_BANNER,
    payload: msg
  };
};

/**
* Set to true if tasks list has been loaded fully
*/
export const tasksHaveBeenRetrieved = (bool) => {
  return {
    type: TASKS_RETRIEVED_FULLY,
    payload: bool
  };
};

/**
* Clears the message of the action modal
*/
export const clearTaskActionsMessage = () => {
  return {  
    type: CLEAR_TASKS_ACTIONS_MESSAGE,
    payload: null
  };
};

/**
* Set to true if you are currently fetching 
*/
export const listTaskGroup = (bool) => {
  return {
    type: LIST_TASKGROUP_IN_PROGRESS,
    payload: bool
  };
};
