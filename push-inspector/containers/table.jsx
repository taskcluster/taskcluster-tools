import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { beautify } from '../lib/utils';

class Table extends Component {

  constructor(props) {
    super(props);
    this.generateHeaders = this.generateHeaders.bind(this);
    this.generateRows = this.generateRows.bind(this);
  }

  /** 
  * Navigate to appropriate route  
  */
  taskClicked(task) {
    const { taskId, taskGroupId } = task.status;
		hashHistory.push(taskGroupId + '/' + taskId);
	}

  /**
  * Clear current status filter
  */
  clearFilter() {
    this.props.setActiveTaskStatus(null);
  }

  /** 
  * Generate table columns 
  */
  generateHeaders() {
      const { activeTaskStatus } = this.props;
      return (
        <tr>
          <th className="tableColumnBaseline">Name</th>
          <th>
            State&nbsp;
            <button className={!!activeTaskStatus ? "" : "hideVisibility"} onClick={this.clearFilter.bind(this)}>
              Clear Filter
            </button>
          </th>
        </tr>
      );
  }

  /** 
  * Generate table rows 
  */
  generateRows() {
      var cols = ["Name", "State"],
          data = this.props.tasks;

      if(data.length > 0) {
  			const status = this.props.activeTaskStatus;
  			let list = data;
  			if(!!status) {
  				list =  data.filter((l) => {
  					return l.status.state == status;
  				});
  			}

        return list.map((task, i) => {
            let state = beautify.labelClassName(task.status.state);

            return (
                <tr onClick={this.taskClicked.bind(this, task)} key={i}>
                  <td className="listings-table-labels-column">{task.task.metadata.name}</td>
                  <td><span className={state}>{task.status.state}</span></td>
                </tr>
            );
        });
  		}
  }

  /** 
  * Render list of tasks 
  */
  renderList() {

        var headerComponents = this.generateHeaders();
        var rowComponents = this.generateRows();

        return (
            <table id="tasks-list" className="table task-list-table">
                <thead>{headerComponents}</thead>
                <tbody className="tasks-list-body">{rowComponents}</tbody>
            </table>
        );
  }

  render() {
    return (
      <div className="table-wrapper">
        {this.renderList()}
      </div>
    );
  }
}

function mapStateToProps(state) {
	return {
		tasks: state.tasks,
		activeTaskStatus: state.activeTaskStatus
	}
}

export default connect(mapStateToProps, actions)(Table)
