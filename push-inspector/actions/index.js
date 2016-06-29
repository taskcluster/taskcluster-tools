import {
	FETCH_TASKS,
	FETCH_TASK,
	FETCH_STATUS,
	UPDATE_STATUS,
	ACTIVE_TASK_STATUS,
	FETCH_ARTIFACTS,
	CREATE_TASK,
	TASK_ACTIONS_ERROR,
	TASK_ACTIONS_SUCCESS
} from './types';

import taskcluster from 'taskcluster-client';
import { queue } from '../lib/utils';
import slugid from 'slugid';
import _ from 'lodash';
import { hashHistory } from 'react-router';
import { rendering } from '../lib/utils';
import shellescape from 'shell-escape';



//	Get task group list
export function fetchTasks(id) {
	let list = [];
	const limit  = 200;
	return (dispatch) => {
		(function iteratePromises(token) {
			let options = {};
			if (token) {
				options.continuationToken = token;	
			}
			options.limit = limit;
			const request = queue.listTaskGroup(id, options);
			request.then(({tasks, continuationToken}) => {
				list = list.concat(tasks);
				dispatch({
					type: FETCH_TASKS,
					payload: list
				});
				if(continuationToken) {
					iteratePromises(continuationToken);
				}
			});
		}());
	}
}

//	Get task definition
export function fetchTask(id) {
	const request = queue.task(id);
	return (dispatch) => {
		request.then((task) => {
			dispatch({
				type: FETCH_TASK,
				payload: task
			})
		});
	}
}

//	Fetch list of artifacts
export function fetchArtifacts(id) {
	const request = queue.listLatestArtifacts(id);
	return (dispatch) => {
		request.then((data) => {
			dispatch({
				type: FETCH_ARTIFACTS,
				payload: data.artifacts
			})
		});
	}
}

//	Get task definition
export function removeTasks() {
	const empty = [];
	return {
		type: FETCH_TASKS,
		payload: empty
	}
}

//	Get task status
export function fetchStatus(id) {
	const request = queue.status(id);
	return (dispatch) => {
		request.then(({status}) => {
			dispatch({
				type: FETCH_STATUS,
				payload: status
			})
		});
	}
}

// Set Status to the 6 possible states (Completed, Pending, Running, etc.)
export function setActiveTaskStatus(status) {
	return {
		type: ACTIVE_TASK_STATUS,
		payload: status
	}
}

export function purge(provisionerId, workerType, selectedCaches, successMessage) {   
  
  let purgeCache = new taskcluster.PurgeCache({
    credentials: JSON.parse(localStorage.credentials)
  });

  let cachesPromise = Promise.all(selectedCaches.map(cache => {
    return purgeCache.purgeCache(
      provisionerId, workerType, {cacheName: cache});
  }));

  return (dispatch) => {
		cachesPromise.then((data) => {
			dispatch({
				type: TASK_ACTIONS_SUCCESS,
				payload: rendering.renderSuccess(successMessage)
			})
		}, (err) => {		
			dispatch({
				type: TASK_ACTIONS_ERROR,
				payload: rendering.renderError(err)
			})	
		});
	}

}

// Retrigger a task
export function retriggerTask(list, toClone, successMessage) {	
	const 	taskId = slugid.nice(),
			task = _.cloneDeep(toClone),
			now = Date.now(),
			created = Date.parse(task.created);

    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();
    task.retries = 0;

    const request = queue.createTask(taskId, task);

	return (dispatch) => {
		request.then((data) => {			
			
			let dataObj = { task, status: data.status };
			hashHistory.push(task.taskGroupId + '/' + data.status.taskId);
			
			// Update current list of tasks
			dispatch({
				type: CREATE_TASK,
				payload: list.concat(dataObj)
			})
			// Update modal message
			dispatch({
				type: TASK_ACTIONS_SUCCESS,
				payload: rendering.renderSuccess(successMessage)
			})
			
		}, (err) => {
			dispatch({
				type: TASK_ACTIONS_ERROR,
				payload: rendering.renderError(err)
			})
		});
		
	}	
}

//	Cancel a task
export function cancelTask(taskId, successMessage) {   
	const request = queue.cancelTask(taskId);
	return (dispatch) => {
		request.then(({status}) => {
			dispatch({
				type: TASK_ACTIONS_SUCCESS,
				payload: successMessage
			})
		}, (err) => {
			dispatch({
				type: TASK_ACTIONS_ERROR,
				payload: rendering.renderError(err)
			});
		});
	}

}

//	Schedule a task
export function scheduleTask(taskId, successMessage) {   
	const request = queue.scheduleTask(taskId);
	return (dispatch) => {
		request.then((data) => {
			dispatch({
				type: TASK_ACTIONS_SUCCESS,
				payload: data
			})
		}, (err) => {
			dispatch({
				type: TASK_ACTIONS_ERROR,
				payload: rendering.renderError(err)
			});
		});
	}

}

// Edit and create task
export function editAndCreateTask(oldTask, successMessage) {
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

    // it is currently not updating the list of tasks because creating a task
    // because upon creation, it is not being redirected to push-inspector
    // when it does, it will fire the component cycle methods and they will
    // take care of refreshing the list

    // Update modal message
	return {
		type: TASK_ACTIONS_SUCCESS,
		payload: rendering.renderSuccess(successMessage)
	};
}

// Create Task for One Click Loaner
export function loanerCreateTask(list, id, toClone, successMessage) {	
	const 	taskId = slugid.nice(),
			task = _.cloneDeep(toClone);

	// Strip routes
	delete task.routes;

	// Construct message of the day
	let msg = "\\nCreated by one-click-loaner based on taskId: " +
              id + "\\n" +
              "Original command was: " + shellescape(task.payload.command);

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

    const request = queue.createTask(taskId, task);

	return (dispatch) => {
		request.then((data) => {			
			const 	dataObj = { task, status: data.status },
					location = window.location;

			hashHistory.push(task.taskGroupId + '/' + data.status.taskId);			
			window.open(`${location.protocol}//${location.host}/one-click-loaner/connect/#${data.status.taskId}`);
			
			// Update current list of tasks
			dispatch({
				type: CREATE_TASK,
				payload: list.concat(dataObj)
			});
			// Update modal message
			dispatch({
				type: TASK_ACTIONS_SUCCESS,
				payload: rendering.renderSuccess(successMessage)
			});
			
			
				
			
		}, (err) => {
			dispatch({
				type: TASK_ACTIONS_ERROR,
				payload: rendering.renderError(err)
			})
		});
		
	}	
}
