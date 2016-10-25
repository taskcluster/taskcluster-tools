import React from 'react';
import {
  Glyphicon,
  Button,
  FormGroup,
  FormControl
} from 'react-bootstrap';

export default React.createClass({

  /** Create an initial state */
  getInitialState() {
    return {
      organization: this.props.params.organization || '',
      repository: this.props.params.repository || '',
      sha: this.props.params.sha || ''
    };
  },

  render() {
    return (
      <form className="form-inline" onSubmit={this.onSubmit}>
        <FormGroup>
          <FormControl
            className="form-control input-sm"
            type="text"
            ref="organization"
            placeholder="Organization"
            onChange={e => this.setState({ organization: e.target.value })}
            value={this.state.organization} />
        </FormGroup>

        &nbsp;/&nbsp;

        <FormGroup>
          <FormControl
            className="form-control input-sm"
            type="text"
            ref="repository"
            placeholder="Repository"
            disabled={this.state.organization === ''}
            onChange={e => this.setState({ repository: e.target.value })}
            value={this.state.repository} />
        </FormGroup>

        &nbsp;@&nbsp;

        <FormGroup>
          <FormControl
            className="form-control input-sm"
            type="text"
            ref="sha"
            placeholder="Commit"
            disabled={this.state.repository === ''}
            onChange={e => this.setState({ sha: e.target.value })}
            value={this.state.sha} />
        </FormGroup>

        &nbsp;

        <Button
          bsSize="sm"
          type="submit">
            <Glyphicon glyph="refresh" /> Update
        </Button>

      </form>
    );
  },

  onSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state);
  }
});
