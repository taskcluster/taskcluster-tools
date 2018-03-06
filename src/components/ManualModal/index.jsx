import { PureComponent } from 'react';
import {
  Modal,
  FormGroup,
  ControlLabel,
  FormControl,
  Button,
  Glyphicon
} from 'react-bootstrap';

const certificateIsValid = certificate => {
  if (certificate === '') {
    return true;
  }

  try {
    JSON.parse(certificate);

    return true;
  } catch (err) {
    return false;
  }
};

export default class ManualModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      clientId: null,
      accessToken: null,
      certificate: null
    };
  }

  handleSubmit = event => {
    const { onSubmit } = this.props;

    event.preventDefault();
    onSubmit(this.state);
  };

  render() {
    const { onClose } = this.props;
    const { clientId, accessToken, certificate } = this.state;
    const isValid = clientId && accessToken && certificateIsValid(certificate);
    const onClick = e => {
      e.preventDefault();
      onClose && onClose({ clientId, accessToken, certificate });
    };

    return (
      <Modal show>
        <form className="login-form" onSubmit={this.handleSubmit}>
          <Modal.Header>
            <h4>Manual Sign-In</h4>
          </Modal.Header>

          <Modal.Body>
            <FormGroup controlId="clientId">
              <ControlLabel>Client Id</ControlLabel>
              <FormControl
                required
                className="top-element"
                name="clientId"
                type="text"
                placeholder="clientId"
                onChange={e => this.setState({ clientId: e.target.value })}
              />
            </FormGroup>

            <FormGroup controlId="accessToken">
              <ControlLabel>Access Token</ControlLabel>
              <FormControl
                required
                className="mid-element"
                name="accessToken"
                type="password"
                placeholder="accessToken"
                onChange={e => this.setState({ accessToken: e.target.value })}
              />
            </FormGroup>

            <FormGroup controlId="certificate">
              <ControlLabel>Certificate</ControlLabel>
              <FormControl
                componentClass="textarea"
                className="bottom-element"
                name="certificate"
                rows={8}
                placeholder="JSON certificate (if required)"
                onChange={e => this.setState({ certificate: e.target.value })}
              />
            </FormGroup>
            <p className="text-muted">
              Note that the credentials are not checked for validity.
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button bsStyle="default" onClick={onClick}>
              Cancel
            </Button>
            <Button type="submit" bsStyle="primary" disabled={!isValid}>
              <Glyphicon glyph="paste" /> Sign In
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}
