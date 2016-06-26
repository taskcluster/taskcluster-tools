import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
//import ProgressBar from '../components/progressBar';
import Table from './table';
import taskcluster from 'taskcluster-client';
import { webListener } from '../lib/utils';


class Listings extends Component {

  constructor(props) {
    super(props);
    this.listener = null;
    this.webListener = webListener();
  }

  // Close Listener connection
  stopListening() {
    this.webListener.stopListening();
  }

  startListening(taskGroupId, onMessageAction) {
    this.webListener.startListening(taskGroupId, onMessageAction);
  }


  //  Remove the list of tasks that were previously loaded
  componentWillUnmount() {
      this.props.removeTasks();
      this.stopListening();
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.params.taskGroupId != this.props.params.taskGroupId) {
      this.webListener.stopListening();
      this.stopListening();
      this.startListening(this.props.params.taskGroupId, this.props.fetchTasks);
    }
  }

  componentWillMount() {
    const { taskGroupId } = this.props.params;
    this.props.fetchTasks(taskGroupId);
    this.startListening(taskGroupId, this.props.fetchTasks);
  }

  render() {
    const tasks = this.props.tasks;
    return (
      <div>
        <div className="col-xs-6  ">
          <Table />
        </div>
        <div className="col-xs-6">
          {this.props.children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tasks: state.tasks,
  }
}

export default connect(mapStateToProps, actions )(Listings)
