import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as bs from 'react-bootstrap';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import TaskDetail from '../components/taskDetail';
import TaskRun from '../components/taskRun';

class TabsView extends Component {

	constructor(props) {
		super(props);
		this.state = {
			tabIndex: 0
		}

		this.handleSelect = this.handleSelect.bind(this);
	}

	handleSelect(index, last) {
		this.setState({tabIndex: index});
	}

	fetchTaskData() {
		const { params, fetchArtifacts, fetchTask, fetchStatus } = this.props;
		fetchArtifacts(params.taskId);
		fetchTask(params.taskId);
		fetchStatus(params.taskId);
	}

	componentWillMount() {
		this.fetchTaskData();
	}


	componentDidUpdate(prevProps, prevState) {
		//	This can happen when retriggering a task or clicking on a task
		if(prevProps.params.taskId != this.props.params.taskId) {
			this.fetchTaskData();
			this.setState({tabIndex: 0});
		}
	}

	

	render() {
		const { params, task, status, artifacts } = this.props;
		const { tabIndex } = this.state;

		return (

	      <Tabs
	        onSelect={this.handleSelect}
	        selectedIndex={tabIndex}
	      >
	        <TabList>
	          <Tab>Task</Tab>
	          <Tab>Run</Tab>
			  <Tab>Try</Tab>
	        </TabList>

	        <TabPanel>
	          <TaskDetail task={task} status={status} />
	        </TabPanel>
	        <TabPanel>
	          <TaskRun task={task} status={status} artifacts={artifacts} />
	        </TabPanel>
		    <TabPanel>
	          <h4>Try</h4>
						Developers would come to this view to use the API that ahal is working on
	        </TabPanel>
	      </Tabs>
	    )
  	}
}
function mapStateToProps(state) {
	return {
		task: state.task,
		status: state.status,
		artifacts: state.artifacts
	}
}


export default connect(mapStateToProps, actions )(TabsView);
