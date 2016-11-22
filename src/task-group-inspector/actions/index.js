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
  LIST_TASKGROUP_IN_PROGRESS,
} from './types';

// Helper functions
import {
  taskActionsInProgress,
  renderActionSuccess,
  renderActionError,
  createTask,
} from './helper';
import {queue} from '../lib/utils';

// Modules
import taskcluster from 'taskcluster-client';
import slugid from 'slugid';
import _ from 'lodash';
import {hashHistory} from 'react-router';

export const setDashboardBanner = msg => ({
  type: SET_DASHBOARD_BANNER,
  payload: msg,
});

/**
 * Set to true if tasks list has been loaded fully
 */
export const tasksHaveBeenRetrieved = isRetrieved => ({
  type: TASKS_RETRIEVED_FULLY,
  payload: isRetrieved,
});

/**
 * Clears the message of the action modal
 */
export const clearTaskActionsMessage = () => ({
  type: CLEAR_TASKS_ACTIONS_MESSAGE,
});

/**
 * Set to true if you are currently fetching
 */
export const listTaskGroup = isFetching => ({
  type: LIST_TASKGROUP_IN_PROGRESS,
  payload: isFetching,
});

/**
* Get the list of tasks in small steps
* Set isLimited to true if you want to fetch in steps
* Set to false otherwise
*/
export const fetchTasksInSteps = (taskGroupId, isLimited) => {
  const options = {};
  const limit = 200;
  let token = null;
  let response = null;

  return async (dispatch, getState) => {
    dispatch(listTaskGroup(true));

    do {
      if (token) {
        options.continuationToken = token;
      }

      if (isLimited) {
        options.limit = limit;
      }

      /* eslint-disable babel/no-await-in-loop */
      try {
        response = await queue.listTaskGroup(taskGroupId, options);

        // do not dispatch if taskGroupId changed sometime
        // between the start and end of the async request
        if (taskGroupId !== getState().taskGroup) {
          return;
        }

        // Dispatch tasks
        dispatch({
          type: isLimited ? FETCH_TASKS_IN_STEP : FETCH_TASKS_FULLY,
          payload: response.tasks,
        });

        // Flag to indicate whether list has been loaded
        dispatch(tasksHaveBeenRetrieved(!response.continuationToken));
        token = response.continuationToken;
      } catch (err) {
        // taskGroupId not found
        token = null;
        dispatch(setDashboardBanner(err));
      }
    } while (token);
    /* eslint-enable babel/no-await-in-loop */

    dispatch(listTaskGroup(false));
  };
};

/**
* Get task definition
*/
export const fetchTask = taskId => async dispatch => {
  try {
    const task = await queue.task(taskId);

    dispatch({
      type: FETCH_TASK,
      payload: task,
    });
  } catch (err) {
    dispatch(setDashboardBanner(err));
  }
};

export const fetchArtifacts = taskId => async dispatch => {
  const response = await queue.listLatestArtifacts(taskId);

  dispatch({
    type: FETCH_ARTIFACTS,
    payload: response.artifacts,
  });
};

export const removeTasks = () => ({
  type: REMOVE_TASKS,
});

export const fetchStatus = taskId => async dispatch => {
  try {
    const response = await queue.status(taskId);

    dispatch({
      type: FETCH_STATUS,
      payload: response.status,
    });
  } catch (err) {
    dispatch(setDashboardBanner(err));
  }
};

/**
* Filter the list of tasks by setting the status wanted.
* The status filter option can be one of the following states:
* (completed, pending, exception, unscheduled, running, failed)
*/
export const setActiveTaskStatus = status => ({
  type: ACTIVE_TASK_STATUS,
  payload: status,
});

export const activeTaskGroupId = taskGroupId => ({
  type: ACTIVE_TASK_GROUP_ID,
  payload: taskGroupId,
});

/**
* Purge a task
*/
export const purge = (provisionerId, workerType, selectedCaches, successMessage) => {
  // Setup purgeCache
  const purgeCache = localStorage.credentials ?
    new taskcluster.PurgeCache({credentials: JSON.parse(localStorage.credentials)}) :
    new taskcluster.PurgeCache();

  return async dispatch => {
    dispatch(taskActionsInProgress(true));

    try {
      const promises = selectedCaches
        .map(cacheName => purgeCache.purgeCache(provisionerId, workerType, {cacheName}));

      await Promise.all(promises);

      dispatch(renderActionSuccess(successMessage));
      dispatch(taskActionsInProgress(false));
    } catch (err) {
      dispatch(renderActionError(err));
      dispatch(taskActionsInProgress(false));
    }
  };
};

export const retriggerTask = (list, toClone, successMessage) => {
  const taskId = slugid.nice();
  const task = _.cloneDeep(toClone);
  const now = Date.now();
  const created = Date.parse(task.created);

  task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
  task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
  task.created = new Date(now).toJSON();
  task.retries = 0;

  return async dispatch => {
    dispatch(taskActionsInProgress(true));

    try {
      const response = await queue.createTask(taskId, task);

      hashHistory.push(`${task.taskGroupId}/${response.status.taskId}`);
      // Update current list of tasks
      dispatch(createTask(list, {task, status: response.status}));
      // Update modal message
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    }
  };
};

export const cancelTask = (taskId, successMessage) => async dispatch => {
  dispatch(taskActionsInProgress(true));

  try {
    await queue.cancelTask(taskId);
    dispatch(renderActionSuccess(successMessage));
  } catch (err) {
    dispatch(renderActionError(err));
  } finally {
    dispatch(taskActionsInProgress(false));
  }
};

export const scheduleTask = (taskId, successMessage) => async dispatch => {
  dispatch(taskActionsInProgress(true));

  try {
    await queue.scheduleTask(taskId);
    dispatch(renderActionSuccess(successMessage));
  } catch (err) {
    dispatch(renderActionError(err));
  } finally {
    dispatch(taskActionsInProgress(false));
  }
};

export const editAndCreateTask = (oldTask, successMessage) => {
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
    'requires',
  ];
  const newTask = _.omit(oldTask, exclude);

  // overwrite task-creator's local state with this new task
  localStorage.setItem('task-creator/task', JSON.stringify(newTask));

  // ..and go there
  window.open(`${location.protocol}//${location.host}/task-creator`);

  // Update modal message
  return renderActionSuccess(successMessage);
};

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

  // Set task.retries to 0
  task.retries = 0;

  return async dispatch => {
    dispatch(taskActionsInProgress(true));

    try {
      const response = await queue.createTask(taskId, task);

      hashHistory.push(`${task.taskGroupId}/${response.status.taskId}`);
      window.open(`${location.protocol}//${location.host}/one-click-loaner/connect/#${response.status.taskId}`);

      // Update current list of tasks
      dispatch(createTask(list, {task, status: response.status}));
      dispatch(renderActionSuccess(successMessage));
    } catch (err) {
      dispatch(renderActionError(err));
    } finally {
      dispatch(taskActionsInProgress(false));
    }
  };
};
