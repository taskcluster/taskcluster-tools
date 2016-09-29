import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { beautified } from '../lib/utils';

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
    hashHistory.push(`${task.status.taskGroupId}/${task.status.taskId}`);
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
        <th className="table-column-baseline">
          <span className="table-header">Name</span>
        </th>
        <th>
          <span className="table-header">State</span>&nbsp;
          <button className={activeTaskStatus ? '' : 'hideVisibility'} onClick={this.clearFilter.bind(this)}>
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
    const data = this.props.tasks;

    if (!data.length) {
      return;
    }

    const status = this.props.activeTaskStatus;
    const list = !status ? data : data.filter(l => l.status.state === status);

    return list.map((task, i) => {
      const state = beautified.labelClassName(task.status.state);

      return (
        <tr className="listings-table-labels-row" onClick={() => this.taskClicked(task)} key={i}>
          <td className="listings-table-labels-column">{task.task.metadata.name}</td>
          <td><span className={state}>{task.status.state}</span></td>
        </tr>
      );
    });
  }

  /**
  * Render list of tasks
  */
  renderList() {
    const headerComponents = this.generateHeaders();
    const rowComponents = this.generateRows();

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

const mapStateToProps = ({ tasks, activeTaskStatus }) => ({ tasks, activeTaskStatus });

export default connect(mapStateToProps, actions)(Table);
