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
	CLEAR_TASKS_ACTIONS_MESSAGE
} from './types';

// Helper functions
import { 
	taskActionsInProgress,
	taskGroupIdNotAvailable,
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
import shellescape from 'shell-escape';
import update from 'react-addons-update';

/**
* Get the list of tasks in small steps
* Set limitBool to true if you want to fetch in steps
* Set to false otherwise
*/
export const fetchTasksInSteps = (id, limitBool) => {
	let	options = {},
			token = undefined,
			res = undefined;

	const limit  = 200;
	
	return async (dispatch) => {
		while (true) {	
			dispatch(taskGroupIdNotAvailable(false));
			if (token) { options.continuationToken = token;	}
			if (limitBool == true) { options.limit = limit;	}
			try {
				res = await queue.listTaskGroup(id, options); 
				let tasks = res.tasks;
				if(limitBool == true) {
					dispatch({
						type: FETCH_TASKS_IN_STEP,
						payload: tasks
					});	
				} else {
					dispatch({
						type: FETCH_TASKS_FULLY,
						payload: tasks
					});
				}			

				if(!!res.continuationToken) {
					dispatch(tasksHaveBeenRetrieved(false));
				} else {
					// Set a flag indicating list has been loaded
					dispatch(tasksHaveBeenRetrieved(true));
				}

			} catch(err) {
				dispatch(taskGroupIdNotAvailable(true));
			} finally {
				token = res.continuationToken;
				if(!!!token) {
					break;
				}
			}			
		} 
	}
}

/**	
* Get task definition
*/
export const fetchTask = (id) => {
	return async (dispatch) => {
		let task;
		try {
			task = await queue.task(id);
			dispatch({
				type: FETCH_TASK,
				payload: task
			})
		} catch(err) {

		}
			
	}
}

/**	
* Get artifacts list
*/
export const fetchArtifacts = (id) => {
	let res;

	return async (dispatch) => {
		try {
			res = await queue.listLatestArtifacts(id);
			dispatch({
				type: FETCH_ARTIFACTS,
				payload: res.artifacts
			});
		} catch(err) {

		}		
	}
}

/**
* Remove list of tasks
*/
export const removeTasks = () => {
	const empty = [];
	return {
		type: REMOVE_TASKS,
		payload: empty
	}
}

/**
* Get task status
*/
export const fetchStatus = (id) => {
	let res,
			status;

	return async (dispatch) => {
		try {
			res = await queue.status(id);
			status = res.status;

			dispatch({
				type: FETCH_STATUS,
				payload: status
			});

		} catch(err) {

		}		
	}
}

/**
* Set status of a task (e.g, pending)
*/
export const setActiveTaskStatus = (status) => {
	return {
		type: ACTIVE_TASK_STATUS,
		payload: status
	}
}

/**
* Purge a task
*/
export const purge = (provisionerId, workerType, selectedCaches, successMessage) => {   
  let purgeCache;

  // Setup purgeCache
  if(localStorage.credentials) {
	  purgeCache = new taskcluster.PurgeCache({
	    credentials: JSON.parse(localStorage.credentials)
	  });
	} else{
	  purgeCache = new taskcluster.PurgeCache();
	}

  
  const cachesPromise = Promise.all(selectedCaches.map(cache => {
    return purgeCache.purgeCache(
      provisionerId, workerType, {cacheName: cache});
  }));

  return (dispatch) => {
		dispatch(taskActionsInProgress(true));
		cachesPromise.then((data) => {
			dispatch(renderActionSuccess(successMessage))
			dispatch(taskActionsInProgress(false));
		}, (err) => {		
			dispatch(renderActionError(err))
			dispatch(taskActionsInProgress(false));
		});	
	}

}

/**
* Retrigger a task
*/
export const retriggerTask = (list, toClone, successMessage) => {	
	const 	taskId = slugid.nice(),
					task = _.cloneDeep(toClone),
					now = Date.now(),
					created = Date.parse(task.created);

  task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
  task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
  task.created = new Date(now).toJSON();
  task.retries = 0;

  
  return async (dispatch) => {
		let res,
				dataObj;

		dispatch(taskActionsInProgress(true));

		try {
			res = await queue.createTask(taskId, task);
			dataObj = { task, status: res.status };
			hashHistory.push(task.taskGroupId + '/' + res.status.taskId);
			
			// Update current list of tasks
			dispatch(createTask(list, dataObj));
			// Update modal message
			dispatch(renderActionSuccess(successMessage));
		} catch(err) {
			dispatch(renderActionError(err));
		}	finally {
			dispatch(taskActionsInProgress(false));
		}	
	}
}

/**
* Cancel a task
*/
export const cancelTask = (taskId, successMessage) => {   
	let res;

	return async (dispatch) => {

		dispatch(taskActionsInProgress(true));

		try {
			res = await queue.cancelTask(taskId);
			dispatch(renderActionSuccess(successMessage));
		} catch(err) {
			dispatch(renderActionError(err));
		}	finally {
			dispatch(taskActionsInProgress(false));
		}	
	}

}

/**
* Schedule a task
*/
export const scheduleTask = (taskId, successMessage) => {   
	let res;
	
	return async (dispatch) => {

		dispatch(taskActionsInProgress(true));

		try {
			res = await queue.scheduleTask(taskId);
			dispatch(renderActionSuccess(successMessage));
		} catch(err) {
			dispatch(renderActionError(err));
		}	finally {
			dispatch(taskActionsInProgress(false));
		}	
	}

}

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
    localStorage.setItem("task-creator/task", JSON.stringify(newTask));

    // ..and go there
    window.open(`${location.protocol}//${location.host}/task-creator`);

 
    // Update modal message
    return renderActionSuccess(successMessage);

}

/**
* One Click Loaner action
*/
export const loanerCreateTask = (list, id, toClone, successMessage) => {	
	const 	taskId = slugid.nice(),
					task = _.cloneDeep(toClone);

	// Strip routes
	delete task.routes;

	task.payload.env = task.payload.env || {};
  task.payload.env.TASKCLUSTER_INTERACTIVE = 'true';

		

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
			const 	dataObj = { task, status: res.status },
							location = window.location;

			hashHistory.push(task.taskGroupId + '/' + res.status.taskId);			
			window.open(`${location.protocol}//${location.host}/one-click-loaner/connect/#${res.status.taskId}`);
			
			// Update current list of tasks
			dispatch(createTask(list, dataObj));

			dispatch(renderActionSuccess(msg));
		} catch(err) {
			dispatch(renderActionError(err));
		}	finally {
			dispatch(taskActionsInProgress(false));
		}	
	}

}

/**
* Set dashboard banner
*/
export const setDashboardBanner = (hasErrored) => {   
	return {
		type: SET_DASHBOARD_BANNER,
		payload: hasErrored
	}
}

/**
* Set to true if tasks list has been loaded fully
*/
export const tasksHaveBeenRetrieved = (bool) => {
	return {
		type: TASKS_RETRIEVED_FULLY,
		payload: bool
	}
}

export const clearTaskActionsMessage = () => {
	return {	
		type: CLEAR_TASKS_ACTIONS_MESSAGE,
		payload: null
	}
}



// //	Update entry in tasks list
// export const updateListings = (list, status) => {
// 	const updatedTask = queue.task(status.taskId);
// 	return (dispatch) => {
// 		updatedTask.then((task) => {
// 			console.log('before updating list is: ', list);
// 			// Check for a match
// 			const match = _.findIndex(list, function(o) { return o.status.taskId == status.taskId; });

// 			// update entry if match
// 			if(match > -1) {
				
// 			    var updatedStatus = update(list[match], {status: {$set: status}}); 

// 			    var newData = update(list, {
// 			        $splice: [[match, 1, updatedStatus]]
// 			    });

// 				dispatch({
// 					type: FETCH_TASKS,
// 					payload: newData
// 				});

// 				// list[match].status = status;
// 				// list = Object.assign({}, list);
// 				console.log('update existing entry to list: ', list);
// 			} else {
// 				console.log('creating new entry');
// 				list = list.concat({task, status});
// 				dispatch({
// 					type: FETCH_TASKS,
// 					payload: list
// 				});

// 			}


// 			console.log('after updating list is: ', list);

			
// 		});
// 	}
// }

