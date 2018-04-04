import { Component } from 'react';
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
import SearchForm from '../../components/SearchForm';

export default class SecretsManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      secrets: null,
      error: null,
      secretIdContains: ''
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

  handleReloadSecrets = () => this.props.history.replace('/secrets');

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
      <Table condensed hover>
        <thead>
          <tr>
            <th>SecretId</th>
          </tr>
        </thead>
        <tbody>
          {secrets
            .filter(id => id.includes(this.state.secretIdContains))
            .map(id => (
              <tr
                key={`secret-row-${id}`}
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
  handleSearchChange = value => this.setState({ secretIdContains: value });

  render() {
    const { secretId } = this.props;
    const { secrets } = this.state;

    return (
      <Row>
        <HelmetTitle title="Secrets Manager" />
        <Col md={5}>
          <SearchForm
            label="Secret Id Containing"
            onSearch={this.handleSearchChange}
          />
          {this.renderSecretsTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              onClick={this.handleReloadSecrets}
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
        <Col md={7}>
          <SecretEditor
            userSession={this.props.userSession}
            secretId={secretId}
            secrets={this.props.secrets}
            onReloadSecrets={this.handleReloadSecrets}
            selectSecretId={this.selectSecretId}
          />
        </Col>
      </Row>
    );
  }
}
