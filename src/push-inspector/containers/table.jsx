import React, {Component} from 'react';
import {hashHistory} from 'react-router';
import {connect} from 'react-redux';
import {Label} from 'react-bootstrap';
import * as actions from '../actions';

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
    const {activeTaskStatus} = this.props;

    return (
      <tr>
        <th>
          <span className="table-header">State</span>&nbsp;
          <button
            className={activeTaskStatus ? '' : 'hideVisibility'}
            onClick={this.clearFilter.bind(this)}>Clear Filter</button>
        </th>
        <th className="table-column-baseline">
          <span className="table-header">Name</span>
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

    return list.map((task, i) => (
      <tr className="listings-table-labels-row" onClick={() => this.taskClicked(task)} key={i}>
        <td>
          <Label bsSize="sm" className={`label-${task.status.state}`}>{task.status.state}</Label>
        </td>
        <td>{task.task.metadata.name}</td>
      </tr>
    ));
  }

  render() {
    const headerComponents = this.generateHeaders();
    const rowComponents = this.generateRows();

    return (
      <table className="table table-condensed">
        <thead>{headerComponents}</thead>
        <tbody className="tasks-list-body">{rowComponents}</tbody>
      </table>
    );
  }
}

const mapStateToProps = ({tasks, activeTaskStatus}) => ({tasks, activeTaskStatus});

export default connect(mapStateToProps, actions)(Table);
