import { PureComponent } from 'react';
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  Col,
  Button,
  Glyphicon,
  ButtonToolbar
} from 'react-bootstrap';
import { assoc } from 'ramda';
import TimeInput from '../../components/TimeInput';
import ScopeEditor from '../../components/ScopeEditor/index';
import styles from './styles.module.css';

export default class ClientEditor extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      currentClient: props.client
    };
  }

  validClientId = () =>
    /^[A-Za-z0-9@/:._-]+$/.test(this.state.currentClient.clientId || '');

  handleClientIdChange = e =>
    this.setState({
      currentClient: assoc('clientId', e.target.value, this.state.currentClient)
    });

  handleDescriptionChange = e =>
    this.setState({
      currentClient: assoc(
        'description',
        e.target.value,
        this.state.currentClient
      )
    });

  handleExpiresChange = date =>
    this.setState({
      currentClient: assoc('expires', date.toJSON(), this.state.currentClient)
    });

  handleScopesUpdated = scopes =>
    this.setState({
      currentClient: assoc('scopes', scopes, this.state.currentClient)
    });

  handleSubmit = e => {
    e.preventDefault();

    this.props.handleCreateClient(this.state.currentClient);
  };

  render() {
    const { currentClient } = this.state;
    const validClientId = this.validClientId();

    return (
      <div className={styles.editor}>
        <h4 style={{ marginTop: 0 }}>Create New Client</h4>
        <hr style={{ marginBottom: 10 }} />
        <Form horizontal>
          <FormGroup
            controlId="clientId"
            validationState={!validClientId ? 'error' : null}>
            <Col componentClass={ControlLabel} sm={2}>
              ClientId
            </Col>
            <Col sm={10}>
              <FormControl
                type="text"
                value={currentClient.clientId}
                onChange={this.handleClientIdChange}
              />
            </Col>
          </FormGroup>

          <FormGroup controlId="description">
            <Col componentClass={ControlLabel} sm={2}>
              Description
            </Col>
            <Col sm={10}>
              <FormControl
                type="text"
                value={this.state.currentClient.description}
                onChange={this.handleDescriptionChange}
                componentClass="textarea"
              />
            </Col>
          </FormGroup>

          <FormGroup controlId="expires">
            <Col componentClass={ControlLabel} sm={2}>
              Expires
            </Col>
            <Col sm={10}>
              <TimeInput
                value={new Date(currentClient.expires)}
                onChange={this.handleExpiresChange}
                className="form-control"
              />
            </Col>
          </FormGroup>

          <FormGroup controlId="scopes">
            <Col componentClass={ControlLabel} sm={2}>
              Scopes
            </Col>
            <Col sm={10}>
              <ScopeEditor
                editing
                onScopesUpdated={this.handleScopesUpdated}
                scopes={currentClient.scopes}
              />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col smOffset={2} sm={10}>
              <ButtonToolbar>
                <Button
                  bsStyle="primary"
                  type="submit"
                  onClick={this.handleSubmit}
                  disabled={!validClientId}>
                  <Glyphicon glyph="plus" /> Create Client
                </Button>
              </ButtonToolbar>
            </Col>
          </FormGroup>
        </Form>
      </div>
    );
  }
}
