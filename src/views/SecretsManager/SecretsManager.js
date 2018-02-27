import React from 'react';
import {
  Row,
  Col,
  Button,
  Glyphicon,
  InputGroup,
  FormControl,
  Table
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';
import UserSession from '../../auth/UserSession';
import SecretEditor from '../../components/SecretEditor';

export default class SecretsManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      secrets: null,
      error: null,
      secretSearchTerm: ''
    };
  }

  componentWillMount() {
    this.loadSecrets(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
      this.loadSecrets(nextProps);
    }
  }

  loadSecrets = async (props = this.props) => {
    try {
      const { secrets } = await props.secrets.list();

      this.setState({
        secrets,
        error: null
      });
    } catch (err) {
      this.setState({
        secrets: null,
        error: err
      });
    }
  };

  clearSelectedSecret = () => this.props.history.replace('/secrets');

  secretSearchTermChanged = e =>
    this.setState({ secretSearchTerm: e.target.value });

  clearSecretSearchTerm = () => this.setState({ secretSearchTerm: '' });

  selectSecretId = (id = '') =>
    this.props.history.replace(
      `/secrets${id ? `/${encodeURIComponent(id)}` : ''}`
    );

  reloadSecrets = () => this.props.history.replace('/secrets');

  renderSecrets() {
    const filterSecrets = [...new Set(this.state.secrets)]
      .sort()
      .filter(secret => secret.includes(this.state.secretSearchTerm));

    return (
      <Row>
        <Col md={12}>
          <InputGroup style={{ marginBottom: 20 }}>
            <InputGroup.Addon>
              <Glyphicon glyph="search" />
            </InputGroup.Addon>
            <FormControl
              type="text"
              value={this.state.secretSearchTerm}
              onChange={this.secretSearchTermChanged}
            />
            <InputGroup.Button>
              <Button onClick={this.clearSecretSearchTerm}>
                <Glyphicon glyph="remove" /> Clear
              </Button>
            </InputGroup.Button>
          </InputGroup>
          <Table condensed={true} hover={true}>
            <thead>
              <tr>
                <th>SecretId</th>
              </tr>
            </thead>
            <tbody>{filterSecrets.map(this.renderSecretRow)}</tbody>
          </Table>
        </Col>
      </Row>
    );
  }

  renderSecretRow = (id, index) => {
    const isSelected = this.props.selectedSecret === id;

    return (
      <tr key={`secret-row-${index}`} className={isSelected ? 'info' : ''}>
        <td>
          <Link
            to={{
              pathname: `/secrets/${encodeURIComponent(id)}`,
              state: { selectedSecret: id }
            }}>
            <code>{id}</code>
          </Link>
        </td>
      </tr>
    );
  };

  renderSelectedSecret() {
    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.clearSelectedSecret}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={11}>
              <SecretEditor
                userSession={this.props.userSession}
                selectSecretId={this.selectSecretId}
                reloadSecrets={this.loadSecrets}
                secrets={this.state.secrets}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }

  renderInspector() {
    const { selectedSecret } = this.props;
    const { error, secrets } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!secrets) {
      return <Spinner />;
    }

    if (selectedSecret) {
      return this.renderSelectedSecret();
    }

    return this.renderSecrets();
  }

  render() {
    return (
      <div>
        <HelmetTitle title="Secret Inspector" />
        {this.renderInspector()}
      </div>
    );
  }
}
