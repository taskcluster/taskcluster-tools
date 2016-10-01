import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { hashHistory } from 'react-router';
import { FormGroup, FormControl, ControlLabel, InputGroup, Button } from 'react-bootstrap';

const VALID_SLUG = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

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
    const {
      setDashboardBanner, tasksHaveBeenRetrieved, removeTasks, fetchTasksInSteps
    } = this.props;
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
    return !VALID_SLUG.test(this.state.term);
  }

  render() {
    const invalidInput = this.isInvalid();

    return (
      <div>
        <form onSubmit={this.onFormSubmit}>
          <FormGroup validationState={invalidInput ? 'error' : null}>
            <ControlLabel>Task Group ID</ControlLabel>
            <InputGroup>
              <FormControl
                type="text"
                placeholder="Enter a taskGroupId"
                bsClass="form-control"
                value={this.state.term}
                onChange={this.onInputChange} />
              <InputGroup.Button type="submit">
                <Button>
                  <i className="fa fa-search" /> Inspect
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </form>
      </div>
    );
  }
}

export default connect(null, actions)(Search);
