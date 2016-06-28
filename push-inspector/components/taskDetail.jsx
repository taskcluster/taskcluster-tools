import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import PurgeCacheButton from '../buttons/purgeCacheButton';
import RetriggerButton from '../buttons/retriggerButton';
import ScheduleTaskButton from '../buttons/scheduleTaskButton';
import CancelTaskButton from '../buttons/cancelTaskButton';
import { beautify } from '../lib/utils';


export default class TaskDetail extends Component {

	constructor(props) {
		super(props);
	}

	render() {

		if(!!!this.props.task || !!!this.props.status) {
			return <div>Loading...</div>;
		}

		const { task, status, actions } = this.props;
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
							<bs.ButtonToolbar>
								
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
							edit and create and one click loaner
						</td>
					</tr>

				</tbody>
      		</table>
		);

	}
}

// <bs.ButtonToolbar>
// 								<Modal
// 				          label="Edit and Create"
// 				          content="Text in a modal"
// 				          glyph="edit"
// 				          actionOnClick={() => console.log('action clicked')} />
// 								<Modal
// 				          label="One-Click Loaner"
// 				          content="Text in a modal"
// 				          glyph="console"
// 				          actionOnClick={() => console.log('action clicked')} />
// 							</bs.ButtonToolbar>

// function mapStateToProps(state) {
// 	return {
// 		task: state.task,
// 		status: state.status
// 	}
// }

