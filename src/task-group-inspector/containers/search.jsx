import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import path from 'path';
import {FormGroup, FormControl, ControlLabel, InputGroup, Button} from 'react-bootstrap';

const VALID_SLUG = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

class Search extends Component {
  constructor(props) {
    super(props);

    this.state = {
      term: props.taskGroupId || '',
      prevTerm: '',
    };
  }

  /**
   * Handle search query
   */
  onFormSubmit(e) {
    e.preventDefault();

    const {term, prevTerm} = this.state;

    if (this.isInvalid() || prevTerm === term) {
      return;
    }

    this.props.setDashboardBanner(null);
    this.props.tasksHaveBeenRetrieved(false);
    this.props.removeTasks();
    this.props.fetchTasksInSteps(term, true);
    this.setState({prevTerm: term});
    this.props.history.push(path.join('/task-group-inspector', term));
  }

  onInputChange(e) {
    this.setState({term: e.target.value});
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
        <form onSubmit={e => this.onFormSubmit(e)}>
          <FormGroup validationState={invalidInput ? 'error' : null}>
            <ControlLabel>Task Group ID</ControlLabel>
            <InputGroup>
              <FormControl
                type="text"
                placeholder="Enter a taskGroupId"
                bsClass="form-control"
                value={this.state.term}
                onChange={e => this.onInputChange(e)} />
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
