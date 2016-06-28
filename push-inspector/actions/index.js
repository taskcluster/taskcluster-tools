import {
	FETCH_TASKS,
	FETCH_TASK,
	FETCH_STATUS,
	UPDATE_STATUS,
	ACTIVE_TASK_STATUS,
	FETCH_ARTIFACTS,
	CREATE_TASK,
	MODAL_ERROR_MESSAGE
} from './types';

import taskcluster from 'taskcluster-client';
import { queue } from '../lib/utils';
import slugid from 'slugid';
import _ from 'lodash';
import { hashHistory } from 'react-router';



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

// Retrigger a task
export function retriggerTask(list, toClone) {

	var queue = new taskcluster.Queue({
		credentials: JSON.parse(localStorage.credentials)
	});
	
	let taskId = slugid.nice();
	console.log('creating task with id: ', taskId);
    let task = _.cloneDeep(toClone);

    let now = Date.now();
    let created = Date.parse(task.created);
    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();

    task.retries = 0;
    const request = queue.createTask(taskId, task);
	return (dispatch) => {
		console.log('request is: ', request);
		debugger;
		//if(typeof request.then != "undefined") {
			request.then((data) => {			
				let dataObj = { task, status: data.status };
				hashHistory.push(task.taskGroupId + '/' + data.status.taskId);
				
				dispatch({
					type: CREATE_TASK,
					payload: list.concat(dataObj)
				})
				
			}, (err) => {
				dispatch({
					type: MODAL_ERROR_MESSAGE,
					payload: err
				})
			});
		//}
		
	}
	
}
