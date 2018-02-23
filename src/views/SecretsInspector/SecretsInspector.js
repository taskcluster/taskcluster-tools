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

export default class SecretsInspector extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      secrets: null,
      error: null
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

  selectSecretId = (id = '') =>
    this.props.history.replace(
      `/secrets${id ? `/${encodeURIComponent(id)}` : ''}`
    );

  reloadSecrets = () => this.props.history.replace('/secrets');

  renderSecretsTable() {
    const { secretId } = this.props;
    const { error, secrets } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!secrets) {
      return <Spinner />;
    }

    return (
      <Row>
        <Col md={12}>
          <InputGroup style={{ marginBottom: 20 }}>
            <InputGroup.Addon>
              <Glyphicon glyph="search" />
            </InputGroup.Addon>
            <FormControl
              type="text"
              value={this.state.scopeSearchTerm}
              onChange={this.scopeSearchTermChanged}
            />
            <InputGroup.Button>
              <Button onClick={this.clearScopeSearchTerm}>
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
            <tbody>
              {secrets.map((id, index) => (
                <tr
                  key={`secret-row-${index}`}
                  className={secretId === id ? 'info' : null}>
                  <td>
                    <Link to={`/secrets/${encodeURIComponent(id)}`}>
                      <code>{id}</code>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    );
  }

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
              <h4>OVERHERE</h4>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }

  renderInspector() {
    return <div>{this.renderSecretsTable()}</div>;
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
