import React from 'react';
import { Alert, Button, Collapse } from 'react-bootstrap';
import Markdown from '../Markdown';

export default class Error extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOpen = () => this.setState({ open: !this.state.open });

  getTitle() {
    const { error } = this.props;

    if (error.body && error.body.code) {
      return `Error ${error.body.code} `;
    }

    if (error.response && error.response.status) {
      return `HTTP ${error.response.status} `;
    }

    return 'Error ';
  }

  render() {
    const { error } = this.props;

    if (error.response && error.response.status === 403) {
      return (
        <Alert bsStyle="danger">
          <p>You are not authorized to perform the requested action. Please sign in and try again.</p>
        </Alert>
      );
    }

    return (
      <Alert bsStyle="danger">
        <strong>{this.getTitle()}</strong>
        <Markdown>
          {error.message}
        </Markdown>
        {process.env.NODE_ENV === 'development' && <pre>{error.stack}</pre>}
        {error.body && error.body.requestInfo && (
          <div>
            <Button
              bsSize="xsmall"
              onClick={this.handleOpen}>
              Additional details...
            </Button>
            <Collapse in={this.state.open}>
              <pre>{JSON.stringify(error.body.requestInfo, null, 2)}</pre>
            </Collapse>
          </div>
        )}
      </Alert>
    );
  }
}
