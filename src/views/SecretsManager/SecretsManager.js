import React from 'react';
import {
  Row,
  Col,
  ButtonToolbar,
  Button,
  Glyphicon,
  Table
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';
import SecretEditor from './SecretEditor';
import UserSession from '../../auth/UserSession';

export default class SecretsManager extends React.PureComponent {
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

  clearSelectedSecret = () => {};

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
          <br />
          <br />
          <HelmetTitle title="Secrets Renderer" />
          <SecretEditor
            userSession={this.props.userSession}
            secretId={this.props.secretId}
            secrets={this.props.secrets}
            reloadSecrets={this.reloadSecrets}
            selectSecretId={this.selectSecretId}
          />
        </Col>
      </Row>
    );
  }

  render() {
    const { secretId } = this.props;
    const { secrets } = this.state;

    return (
      <div>
        <Row>
          <HelmetTitle title="Secrets Manager" />
          <Col md={5}>
            {this.renderSecretsTable()}
            <ButtonToolbar>
              <Button
                bsStyle="primary"
                onClick={this.reloadSecrets}
                disabled={!secretId}>
                <Glyphicon glyph="plus" /> Add Secret
              </Button>
              <Button
                bsStyle="success"
                onClick={() => this.loadSecrets(this.props)}
                disabled={!secrets}>
                <Glyphicon glyph="refresh" /> Refresh
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
        {this.renderSelectedSecret()}
      </div>
    );
  }
}
