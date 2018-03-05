import React from 'react';
import { ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
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
      secretsLoaded: [],
      error: null,
      addNewSecret: false
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

  loadSecrets = props => {
    this.setState({ secrets: [], secretsLoaded: [] }, async () => {
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
    });
  };

  selectSecretId = (id = '') =>
    this.props.history.replace(
      `/secrets${id ? `/${encodeURIComponent(id)}` : ''}`
    );

  reloadSecrets = () => this.props.history.replace('/secrets');

  handleAddSecret = () => {
    this.setState({ addNewSecret: !this.state.addNewSecret });
  };

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

  renderSecrets() {
    const { secrets } = this.state;

    return (
      <div>
        <HelmetTitle title="Secrets Manager" />
        {this.renderSecretsTable()}
        <ButtonToolbar>
          <Button bsStyle="primary" onClick={this.handleAddSecret}>
            <Glyphicon glyph="plus" /> Add Secret
          </Button>
          <Button
            bsStyle="success"
            onClick={this.loadSecrets}
            disabled={!secrets}>
            <Glyphicon glyph="refresh" /> Refresh
          </Button>
        </ButtonToolbar>
      </div>
    );
  }

  renderSecretEditor() {
    const { secretId } = this.props;

    return (
      <SecretEditor
        userSession={this.props.userSession}
        secretId={secretId}
        secrets={this.props.secrets}
        reloadSecrets={this.reloadSecrets}
        selectSecretId={this.selectSecretId}
      />
    );
  }

  render() {
    const { secretId } = this.props;
    const { addNewSecret } = this.state;

    if (addNewSecret) {
      return this.renderSecretEditor();
    }

    return !secretId ? this.renderSecrets() : this.renderSecretEditor();
  }
}
