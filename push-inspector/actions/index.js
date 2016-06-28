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



//	Get task group list
// 	This function will iterate recursively to get the full list of tasks
//	It will dispatch on each call
export function fetchTasks(id = "ARUrTTyjQRiXEeo1uySLnA") {
	let list = [];
	return (dispatch) => {
		(function iteratePromises(token) {
			let options = {};
			if (token) {
				options.continuationToken = token;
			}
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
export function fetchTask(id = "AB0MITrrT2WoIfKvmruvyw") {
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
export function fetchArtifacts(id = "AB0MITrrT2WoIfKvmruvyw") {
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
export function fetchStatus(id = "AB0MITrrT2WoIfKvmruvyw") {
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

	var queue = new taskcluster.Queue({
		credentials: JSON.parse(localStorage.credentials)
	});
	
	const taskId = slugid.nice(),
    	task = _.cloneDeep(toClone),
    	now = Date.now(),
    	created = Date.parse(task.created);

    console.log('Creating TaskId: ', taskId);
    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();
    task.retries = 0;

    const request = queue.createTask(taskId, task);

	return (dispatch) => {
		request.then((data) => {			
			
			let dataObj = { task, status: data.status };
			hashHistory.push(task.taskGroupId + '/' + data.status.taskId);
			
			dispatch({
				type: CREATE_TASK,
				payload: list.concat(dataObj)
			})
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
	debugger;
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

//	Schedule a task
export function scheduleTask(taskId, successMessage) {   
  
	const request = queue.scheduleTask(taskId);
	debugger;
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