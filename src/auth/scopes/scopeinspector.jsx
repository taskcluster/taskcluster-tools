import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import path from 'path';
import {Row, Col, Button, Glyphicon, InputGroup, FormControl, DropdownButton, MenuItem, Table} from 'react-bootstrap';
import {TaskClusterEnhance} from '../../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../../lib/format';
import _ from 'lodash';
import RoleEditor from '../roles/roleeditor';
import ClientEditor from '../clients/clienteditor';
import './scopeinspector.less';

class ScopeInspector extends Component {
  constructor(props) {
    super(props);

    const {params} = this.props.match;
    const selectedScope = params.selectedScope ? decodeURIComponent(params.selectedScope) : '';
    const selectedEntity= params.selectedEntity ? decodeURIComponent(params.selectedEntity) : '';

    this.state = {
      rolesLoaded: false,
      rolesError: null,
      roles: null,
      clientsLoaded: false,
      clientsError: null,
      clients: null,
      selectedScope,
      selectedEntity,
      scopeSearchTerm: '',
      entitySearchMode: 'Has Scope'
    };

    this.updatePath = this.updatePath.bind(this);
    this.clearSelectedEntity = this.clearSelectedEntity.bind(this);
    this.clearSelectedScope = this.clearSelectedScope.bind(this);
    this.selectedScopeChanged = this.selectedScopeChanged.bind(this);
    this.scopeSearchTermChanged = this.scopeSearchTermChanged.bind(this);
    this.clearScopeSearchTerm = this.clearScopeSearchTerm.bind(this);
    this.renderScopeRow = this.renderScopeRow.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // Creates state properties:
    // - rolesLoaded
    // - rolesError
    // - roles
    // - clientsLoaded
    // - clientsError
    // - clients
    const promisedState = {
      roles: this.props.clients.auth.listRoles(),
      clients: this.props.clients.auth.listClients()
    };

    this.props.loadState(promisedState);
  }

  /** Render user-interface */
  render() {
    if (!this.state.roles || !this.state.clients) {
      return (
        this.props.renderWaitFor('roles') ||
        this.props.renderWaitFor('clients') ||
        this.props.renderSpinner()
      );
    }

    return (
      this.renderSelectedEntity() ||
      this.renderSelectedScope() ||
      this.renderScopes()
    );
  }

  updatePath() {
    const selectedScope = this.state.selectedScope ? encodeURIComponent(this.state.selectedScope) : '';
    const selectedEntity = this.state.selectedEntity ? encodeURIComponent(this.state.selectedEntity) : '';
    const url = path.join('/auth/scopes', selectedScope, selectedEntity);

    this.props.history.replace(url);
  }

  renderSelectedEntity() {
    const {selectedEntity} = this.state;

    if (selectedEntity === '') {
      return;
    }

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.clearSelectedEntity}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={11}>
              <h4>
                {selectedEntity.split(':')[0]}: <code>{selectedEntity.split(':')[1]}</code>
              </h4>
            </Col>
          </Row>
          <br /><br />
          {
            _.startsWith(this.state.selectedEntity, 'role:') ? (
              <RoleEditor
                currentRoleId={this.state.selectedEntity.slice('role:'.length)}
                reloadRoleId={this.reload} />
            ) : (
              <ClientEditor
                currentClientId={this.state.selectedEntity.slice('client:'.length)}
                reloadClientId={this.load} />
            )
          }
        </Col>
      </Row>
    );
  }

  clearSelectedEntity() {
    this.setState({selectedEntity: ''}, this.updatePath);
  }

  renderSelectedScope() {
    if (this.state.selectedScope === '') {
      return;
    }

    const mode = this.state.entitySearchMode;
    let match = () => true;

    if (mode === 'Exact') {
      match = scope => scope === this.state.selectedScope;
    } else if (mode === 'Has Scope') {
      match = scope => {
        if (scope === this.state.selectedScope) {
          return true;
        }

        return /\*$/.test(scope) ?
          this.state.selectedScope.indexOf(scope.slice(0, -1)) === 0 :
          false;
      };
    } else if (mode === 'Has Sub-Scope') {
      let pattern = this.state.selectedScope;

      if (!/\*$/.test(pattern)) {
        pattern += '*'; // Otherwise this test doesn't make any sense
      }

      match = scope => (scope === pattern) ?
        true :
        scope.indexOf(pattern.slice(0, -1)) === 0;
    }

    const clients = _.sortBy(
      this.state.clients.filter(client => _.some(client.expandedScopes, match)),
      'clientId'
    );
    const roles = _.sortBy(
      this.state.roles.filter(role => _.some(role.expandedScopes, match)),
      'roleId'
    );

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.clearSelectedScope}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={11}>
              <InputGroup>
                <InputGroup.Addon>Scope</InputGroup.Addon>
                <FormControl
                  type="text"
                  value={this.state.selectedScope}
                  onChange={this.selectedScopeChanged}
                  ref="selectedScope" />
                <DropdownButton
                  componentClass={InputGroup.Button}
                  title={`Match: ${mode}`}
                  pullRight={true}
                  id="match">
                  <MenuItem key="1" onClick={() => this.setEntitySearchMode('Exact')}>
                    <Glyphicon glyph="ok" style={mode === 'Exact' ? {} : {visibility: 'hidden'}} /> Exact
                  </MenuItem>
                  <MenuItem key="2" onClick={() => this.setEntitySearchMode('Has Scope')}>
                    <Glyphicon glyph="ok" style={mode === 'Has Scope' ? {} : {visibility: 'hidden'}} /> Has Scope
                  </MenuItem>
                  <MenuItem key="3" onClick={() => this.setEntitySearchMode('Has Sub-Scope')}>
                    <Glyphicon
                      glyph="ok"
                      style={mode === 'Has Sub-Scope' ? {} : {visibility: 'hidden'}} /> Has Sub-Scope
                  </MenuItem>
                </DropdownButton>
              </InputGroup>
            </Col>
          </Row>
          <br /><br />
          <Table condensed={true} hover={true} className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>
                  <format.Icon name="users" fixedWidth={true} /> Roles /
                  <format.Icon name="user" /> Clients
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={index} onClick={() => this.selectEntity(`role:${role.roleId}`)}>
                  <td>
                    <format.Icon name="users" fixedWidth={true} /> <code>{role.roleId}</code>
                  </td>
                </tr>
              ))}
              {clients.map((client, index) => (
                <tr
                  key={index + roles.length}
                  onClick={() => this.selectEntity(`client:${client.clientId}`)}>
                  <td>
                    <format.Icon name="user" fixedWidth={true} /> <code>{client.clientId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    );
  }

  selectEntity(value) {
    this.setState({selectedEntity: value}, this.updatePath);
  }

  selectedScopeChanged() {
    this.setState({
      selectedScope: findDOMNode(this.refs.selectedScope).value,
    });
  }

  setEntitySearchMode(mode) {
    this.setState({entitySearchMode: mode});
  }

  clearSelectedScope() {
    this.setState({selectedScope: ''}, this.updatePath);
  }

  renderScopes() {
    const scopes = _.uniq(_.flattenDeep([
      this.state.roles.map(role => role.expandedScopes),
      this.state.clients.map(client => client.expandedScopes),
    ]))
    .sort()
    .filter(scope => _.includes(scope, this.state.scopeSearchTerm));

    return (
      <Row>
        <Col md={12}>
          <InputGroup style={{marginBottom: 20}}>
            <InputGroup.Addon><Glyphicon glyph="search" /></InputGroup.Addon>
            <FormControl
              type="text"
              value={this.state.scopeSearchTerm}
              ref="scopeSearchTerm"
              onChange={this.scopeSearchTermChanged} />
            <InputGroup.Button>
              <Button onClick={this.clearScopeSearchTerm}>
                <Glyphicon glyph="remove" /> Clear
              </Button>
            </InputGroup.Button>
          </InputGroup>
          <Table condensed={true} hover={true} className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>
              {scopes.map(this.renderScopeRow)}
            </tbody>
          </Table>
        </Col>
      </Row>
    );
  }

  scopeSearchTermChanged() {
    this.setState({
      scopeSearchTerm: findDOMNode(this.refs.scopeSearchTerm).value,
    });
  }

  clearScopeSearchTerm() {
    this.setState({
      scopeSearchTerm: '',
    });
  }

  /** Render row with scope */
  renderScopeRow(scope, index) {
    const isSelected = this.state.selectedScope === scope;

    return (
      <tr
        key={index}
        className={isSelected ? 'info' : ''}
        onClick={() => this.selectScope(scope)}>
        <td><code>{scope}</code></td>
      </tr>
    );
  }

  selectScope(scope) {
    this.setState({selectedScope: scope}, this.updatePath);
  }
}

const taskclusterOpts = {
  clients: {
    auth: taskcluster.Auth
  },
  name: ScopeInspector.name
};

export default TaskClusterEnhance(ScopeInspector, taskclusterOpts);
