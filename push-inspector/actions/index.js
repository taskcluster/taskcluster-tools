import {
	FETCH_TASKS,
	FETCH_TASK,
	FETCH_STATUS,
	UPDATE_STATUS,
	ACTIVE_TASK_STATUS,
	FETCH_ARTIFACTS
} from './types';

import taskcluster from 'taskcluster-client';

//	Get task group list
// 	This function will iterate recursively to get the full list of tasks
//	It will dispatch on each call
export function fetchTasks(id = "ARUrTTyjQRiXEeo1uySLnA") {
	const queue = new taskcluster.Queue();
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
	const queue = new taskcluster.Queue();
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
	const queue = new taskcluster.Queue();
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
	const queue = new taskcluster.Queue();
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
