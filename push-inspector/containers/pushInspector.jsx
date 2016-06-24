import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Search from './search';
import ProgressBar from '../components/progressBar';
import Loading from '../shared/loading';

class PushInspector extends Component {

  render() {
    const { tasks, children, setActiveTaskStatus, params } = this.props;
    const { taskGroupId } = params;
    return (
      <div>
        <Search />
        <ProgressBar
            taskGroupId = {taskGroupId}
            tasks={tasks}
            setActiveTaskStatus={setActiveTaskStatus}/>
        <div className={(!!tasks.length && !!taskGroupId) || (!!!tasks.length && !!!taskGroupId) ? "hideDisplay" : ""}>
          <Loading />
        </div>
        <div className={!!!tasks.length ? "hideDisplay" : ""}>
          {children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
	return {
		tasks: state.tasks
	}
}

export default connect(mapStateToProps, actions )(PushInspector)
