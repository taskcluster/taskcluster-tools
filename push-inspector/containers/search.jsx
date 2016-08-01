import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { Link, hashHistory } from 'react-router';
import * as bs from 'react-bootstrap';

const VALID_SLUG_ID = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

class Search extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      term: '',
      prevTerm: ''
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  /** 
  * Handle search query 
  */
  onFormSubmit(event) {
    const { setDashboardBanner, tasksHaveBeenRetrieved, removeTasks, fetchTasksInSteps } = this.props;
    const { term, prevTerm } = this.state;

    event.preventDefault();

    if (!this.isInvalid() && prevTerm !== term) {
      setDashboardBanner(null);
      tasksHaveBeenRetrieved(false);
      removeTasks();
      fetchTasksInSteps(term, true);
      hashHistory.push(term);
      this.setState({ prevTerm: term });
    }  
  }

  onInputChange(event) {
    this.setState({ term: event.target.value });
  }

  /**
  * Text input validator
  */
  isInvalid() { 
    // Case 1: If search term is empty, it is valid
    if (!this.state.term) {
      return false;
    }

    // Case 2: Check against regex expression
    return !VALID_SLUG_ID.test(this.state.term);
  }

  render() {
    const invalidInput = this.isInvalid();
    
    return (
      <div>
        <form horizontal onSubmit={this.onFormSubmit} className="input-group search-form">
          <div className="searchLabel">Enter <code>taskGroupId</code></div>
          <bs.FormGroup validationState={invalidInput ? 'error' : null}>
            <bs.FormControl
              type="text"
              placeholder="taskGroupId"
              bsClass="form-control"
              value={this.state.term}            
              onChange={this.onInputChange} />
          </bs.FormGroup>
          <div className="input-group-btn inspect-btn">
            <button type="submit" className="button btn btn-secondary">
              <i className="fa fa-search"></i> Inspect
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default connect(null, actions)(Search);
