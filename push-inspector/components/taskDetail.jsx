import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as bs from 'react-bootstrap';
import PurgeCacheButton from '../buttons/purgeCacheButton';
import RetriggerButton from '../buttons/retriggerButton';
import ScheduleTaskButton from '../buttons/scheduleTaskButton';
import CancelTaskButton from '../buttons/cancelTaskButton';
import EditAndCreateButton from '../buttons/editAndCreateButton';
import OneClickLoanerButton from '../buttons/oneClickLoanerButton';
import { beautify } from '../lib/utils';


export default class TaskDetail extends Component {

	constructor(props) {
		super(props);
	}

	/**
	* Render dependencies list
	*/
	getDependenciesList(task) {
		
		const { dependencies } = task;
		if(!dependencies.length) {
			return <span>-</span>
		}
		return (
			<div>
				<ul className="dependencies-ul">
					{
						dependencies.map((dependency, index) => {
							return (
								<li key={index}>
									<a target="_blank" href={'https://queue.taskcluster.net/v1/task/' + dependency}>{dependency}
									&nbsp;<i className='fa fa-external-link'></i>
									</a>
								</li>
							)
						})
					}
				</ul>
			</div>
		);
	}

	render() {

		if(!!!this.props.task || !!!this.props.status) {
			return <div>Loading...</div>;
		}

		const 	{ task, status, actions } = this.props,
				dependenciesList = this.getDependenciesList(task);
		return (
			<table className="detail-table">
				<tbody>
					<tr>
						<td><b>Name</b></td>
						<td>{task.metadata.name}</td>
					</tr>
					<tr>
						<td><b>Description</b></td>
						<td>{task.metadata.description}</td>
					</tr>
					<tr>
						<td><b>Owner</b></td>
						<td>{task.metadata.owner}</td>
					</tr>
					<tr>
						<td><b>TaskId</b></td>
						<td>
							<a target="_blank" href={'https://queue.taskcluster.net/v1/task/' + status.taskId}>{status.taskId}
								&nbsp;<i className='fa fa-external-link'></i>
							</a>
						</td>
					</tr>
					<tr>
						<td><b>State</b></td>
						<td className={beautify.labelClassName(status.state)}>{status.state}</td>
					</tr>
					<tr>
						<td><b>Actions</b></td>
						<td>
							<bs.ButtonToolbar className="toolbar-btn">							
				          		<ScheduleTaskButton />								
				          		<RetriggerButton
				          			task={task} />													
								<CancelTaskButton />
								<PurgeCacheButton 
									caches = {_.keys(((task || {}).payload || {}).cache || {})}
									provisionerId={task.provisionerId}
	                            	workerType={task.workerType} />	                            		
							</bs.ButtonToolbar>						

						</td>
					</tr>
					<tr>
						<td><b>Debug</b></td>
						<td>
							<bs.ButtonToolbar className="toolbar-btn">
								<EditAndCreateButton />
								<OneClickLoanerButton
									task={task}
									taskId={status.taskId} />
							</bs.ButtonToolbar>
						</td>
					</tr>
					<tr>
						<td><b>Dependencies</b></td>
						<td>
							{dependenciesList}
						</td>
					</tr>
				</tbody>
      		</table>
		);

	}
}


