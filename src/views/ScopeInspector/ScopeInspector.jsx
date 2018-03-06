import { PureComponent } from 'react';
import {
  Row,
  Col,
  Button,
  Glyphicon,
  InputGroup,
  FormControl,
  DropdownButton,
  MenuItem,
  Table
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import RoleEditor from '../../components/RoleEditor';
import ClientEditor from '../../components/ClientEditor';
import HelmetTitle from '../../components/HelmetTitle';
import UserSession from '../../auth/UserSession';

const flatten = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

export default class ScopeInspector extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      roles: null,
      clients: null,
      scopeSearchTerm: '',
      entitySearchMode: 'Has Scope',
      directEntitySearch: false
    };
  }

  componentWillMount() {
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  load = async () => {
    try {
      this.setState({
        roles: await this.props.auth.listRoles(),
        clients: await this.props.auth.listClients(),
        error: null
      });
    } catch (err) {
      this.setState({
        roles: null,
        clients: null,
        error: err
      });
    }
  };

  loadRoles = async () => {
    try {
      this.setState({
        roles: await this.props.auth.listRoles(),
        error: null
      });
    } catch (err) {
      this.setState({
        roles: null,
        error: err
      });
    }
  };

  loadClients = async () => {
    try {
      this.setState({
        clients: await this.props.auth.listClients(),
        error: null
      });
    } catch (err) {
      this.setState({
        clients: null,
        error: err
      });
    }
  };

  handleDeleteRole = async roleId => {
    await this.props.auth.deleteRole(roleId);
    this.props.history.replace('/auth/scopes');
  };

  handleDeleteClient = async clientId => {
    await this.props.auth.deleteClient(clientId);
    this.props.history.replace('/auth/scopes');
  };

  hadnleUpdatePath = () => {
    const selectedScope = this.props.selectedScope
      ? encodeURIComponent(this.props.selectedScope)
      : '';
    const selectedEntity = this.props.selectedEntity
      ? encodeURIComponent(this.props.selectedEntity)
      : '';

    this.props.history.replace(
      `/auth/scopes/${selectedScope}/${selectedEntity}`
    );
  };

  handleClearSelectedEntity = () =>
    this.props.history.replace(
      `/auth/scopes/${encodeURIComponent(this.props.selectedScope)}`
    );

  handleSelectedScopeChanged = e =>
    this.props.history.replace(
      `/auth/scopes/${encodeURIComponent(e.target.value)}`
    );

  handleSetEntitySearchMode = mode => this.setState({ entitySearchMode: mode });

  handleClearSelectedScope = () => this.props.history.replace('/auth/scopes');

  handleScopeSearchTermChanged = e =>
    this.setState({ scopeSearchTerm: e.target.value });

  handleClearScopeSearchTerm = () => this.setState({ scopeSearchTerm: '' });

  handleToggleDirectEntitySearch = () =>
    this.setState({ directEntitySearch: !this.state.directEntitySearch });

  // selectScope = (scope) => this.props.history.replace(`/auth/scopes/${scope}`);

  renderSelectedScope() {
    const { selectedScope } = this.props;
    const mode = this.state.entitySearchMode;
    let match = () => true;

    if (mode === 'Exact') {
      match = scope => scope === selectedScope;
    } else if (mode === 'Has Scope') {
      match = scope => {
        if (scope === selectedScope) {
          return true;
        }

        return /\*$/.test(scope)
          ? selectedScope.indexOf(scope.slice(0, -1)) === 0
          : false;
      };
    } else if (mode === 'Has Sub-Scope') {
      let pattern = selectedScope;

      if (!/\*$/.test(pattern)) {
        pattern += '*'; // Otherwise this test doesn't make any sense
      }

      match = scope =>
        scope === pattern ? true : scope.indexOf(pattern.slice(0, -1)) === 0;
    }

    const searchProperty = this.state.directEntitySearch
      ? 'scopes'
      : 'expandedScopes';
    const clients = this.state.clients
      .filter(client => client[searchProperty].some(match))
      .sort((a, b) => a.clientId.localeCompare(b.clientId));
    const roles = this.state.roles
      .filter(role => role[searchProperty].some(match))
      .sort((a, b) => a.roleId.localeCompare(b.roleId));

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.handleClearSelectedScope}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={11}>
              <InputGroup>
                <InputGroup.Addon>Scope</InputGroup.Addon>
                <FormControl
                  type="text"
                  defaultValue={selectedScope}
                  onBlur={this.handleSelectedScopeChanged}
                />
                <DropdownButton
                  componentClass={InputGroup.Button}
                  title={`Match: ${mode}`}
                  pullRight
                  id="match">
                  <MenuItem
                    key="scope-mode-exact"
                    onClick={() => this.handleSetEntitySearchMode('Exact')}>
                    <Glyphicon
                      glyph="ok"
                      style={mode === 'Exact' ? {} : { visibility: 'hidden' }}
                    />{' '}
                    Exact
                  </MenuItem>
                  <MenuItem
                    key="scope-mode-has"
                    onClick={() => this.handleSetEntitySearchMode('Has Scope')}>
                    <Glyphicon
                      glyph="ok"
                      style={
                        mode === 'Has Scope' ? {} : { visibility: 'hidden' }
                      }
                    />{' '}
                    Has Scope
                  </MenuItem>
                  <MenuItem
                    key="scope-mode-has-sub"
                    onClick={() =>
                      this.handleSetEntitySearchMode('Has Sub-Scope')
                    }>
                    <Glyphicon
                      glyph="ok"
                      style={
                        mode === 'Has Sub-Scope' ? {} : { visibility: 'hidden' }
                      }
                    />{' '}
                    Has Sub-Scope
                  </MenuItem>
                  <MenuItem key="match-options-divider" divider />
                  <MenuItem
                    key="toggle-match-mode"
                    onClick={this.handleToggleDirectEntitySearch}>
                    <Glyphicon
                      glyph="ok"
                      style={
                        this.state.directEntitySearch
                          ? null
                          : { visibility: 'hidden' }
                      }
                    />{' '}
                    Direct Ownership
                  </MenuItem>
                </DropdownButton>
              </InputGroup>
            </Col>
          </Row>
          <br />
          <br />
          <Table condensed hover className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>
                  <Icon name="users" fixedWidth /> Roles /
                  <Icon name="user" /> Clients
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map(({ roleId }, index) => (
                <tr key={`scope-roles-${index}`}>
                  <td>
                    <Link
                      to={`/auth/scopes/${encodeURIComponent(
                        selectedScope
                      )}/role:${encodeURIComponent(roleId)}`}>
                      <Icon name="users" fixedWidth /> <code>{roleId}</code>
                    </Link>
                  </td>
                </tr>
              ))}
              {clients.map(({ clientId }, index) => (
                <tr key={`scope-clients-${index}`}>
                  <td>
                    <Link
                      to={`/auth/scopes/${encodeURIComponent(
                        selectedScope
                      )}/client:${encodeURIComponent(clientId)}`}>
                      <Icon name="user" fixedWidth /> <code>{clientId}</code>
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

  renderScopes() {
    const scopes = [
      ...new Set(
        flatten([
          this.state.roles.map(role => role.expandedScopes),
          this.state.clients.map(client => client.expandedScopes)
        ])
      )
    ]
      .sort()
      .filter(scope => scope.includes(this.state.scopeSearchTerm));

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
              onChange={this.handleScopeSearchTermChanged}
            />
            <InputGroup.Button>
              <Button onClick={this.handleClearScopeSearchTerm}>
                <Glyphicon glyph="remove" /> Clear
              </Button>
            </InputGroup.Button>
          </InputGroup>
          <Table condensed hover className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>{scopes.map(this.renderScopeRow)}</tbody>
          </Table>
        </Col>
      </Row>
    );
  }

  renderScopeRow = (scope, index) => {
    const isSelected = this.props.selectedScope === scope;

    return (
      <tr
        key={`render-scope-row-${index}`}
        className={isSelected ? 'info' : ''}>
        <td>
          <Link to={`/auth/scopes/${encodeURIComponent(scope)}`}>
            <code>{scope}</code>
          </Link>
        </td>
      </tr>
    );
  };

  renderSelectedEntity() {
    const { selectedEntity } = this.props;

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.handleClearSelectedEntity}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={11}>
              <h4>
                {selectedEntity.split(':')[0]}:{' '}
                <code>{selectedEntity.split(':')[1]}</code>
              </h4>
            </Col>
          </Row>
          <br />
          <br />
          {selectedEntity.startsWith('role:') ? (
            <RoleEditor
              auth={this.props.auth}
              reloadRoles={this.loadRoles}
              onDeleteRole={this.handleDeleteRole}
              currentRoleId={selectedEntity.slice('role:'.length)}
            />
          ) : (
            <ClientEditor
              auth={this.props.auth}
              reloadClients={this.loadClients}
              onDeleteClient={this.handleDeleteClient}
              currentClientId={selectedEntity.slice('client:'.length)}
            />
          )}
        </Col>
      </Row>
    );
  }

  renderInspector() {
    const { selectedEntity, selectedScope } = this.props;
    const { error, roles, clients } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!roles || !clients) {
      return <Spinner />;
    }

    if (selectedEntity) {
      return this.renderSelectedEntity();
    }

    if (selectedScope) {
      return this.renderSelectedScope();
    }

    return this.renderScopes();
  }

  render() {
    return (
      <div>
        <HelmetTitle title="Scope Inspector" />
        {this.renderInspector()}
      </div>
    );
  }
}
