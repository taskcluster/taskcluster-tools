import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { Link, hashHistory } from 'react-router';


class Search extends Component {

  constructor(props) {
    super(props);
    this.state = {
      term: ''
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

  }

  onFormSubmit(event) {
    event.preventDefault();
    hashHistory.push(this.state.term);
    this.props.removeTasks();
    this.props.fetchTasks(this.state.term);

  }

  onInputChange(event) {
    this.setState({term: event.target.value});
  }


  render() {

    return (
      <div>
        <form onSubmit={this.onFormSubmit} className="input-group search-form">
          <input
            placeholder="Enter a task group ID"
            className="form-control"
            value={this.state.term}
            onChange={this.onInputChange} />

          <div className="input-group-btn">
              <input className="button btn btn-secondary" type="submit" value="Inspect" />
          </div>
        </form>
      </div>
    );

  }
}

export default connect(null, actions)(Search)
