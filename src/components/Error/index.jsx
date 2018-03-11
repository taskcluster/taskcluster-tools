import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Collapse } from 'react-bootstrap';
import Markdown from '../Markdown';

export default class Error extends PureComponent {
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
    const { open } = this.state;

    // Handle the common 403 error more neatly, especially since its message is large but
    // sometimes useful.
    if (
      error.response &&
      error.response.status === 403 &&
      error.body.code === 'InsufficientScopes'
    ) {
      return (
        <Alert bsStyle="danger">
          <p>
            You are not authorized to perform the requested action. Please sign
            in and try again, or verify your scopes in the{' '}
            <Link to="/credentials">Credentials Manager</Link>.
          </p>
          <Button bsSize="xsmall" onClick={this.handleOpen}>
            Additional details...
          </Button>
          <Collapse in={open}>
            <div>
              <Markdown>{error.message}</Markdown>
            </div>
          </Collapse>
        </Alert>
      );
    }

    return (
      <Alert bsStyle="danger">
        <strong>{this.getTitle()}</strong>
        <Markdown>{error.message}</Markdown>
        {process.env.NODE_ENV === 'development' && (
          <div>
            Stack (development only):<pre>{error.stack}</pre>
          </div>
        )}
        {error.body &&
          error.body.requestInfo && (
            <div>
              <Button bsSize="xsmall" onClick={this.handleOpen}>
                Additional details...
              </Button>
              <Collapse in={open}>
                <pre>{JSON.stringify(error.body.requestInfo, null, 2)}</pre>
              </Collapse>
            </div>
          )}
      </Alert>
    );
  }
}
