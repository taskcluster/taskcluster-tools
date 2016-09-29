import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Row, Col, Button, Glyphicon, InputGroup, FormControl,
  DropdownButton, MenuItem, Table
} from 'react-bootstrap';
import * as utils from '../../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../../lib/format';
import _ from 'lodash';
import RoleEditor from '../roles/roleeditor';
import ClientEditor from '../clients/clienteditor';
import './scopeinspector.less';

export default React.createClass({
  displayName: 'ScopeInspector',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth: taskcluster.Auth
      }
    }),
    // Serialize selectedScope and selectedEntity to location.hash as string
    utils.createLocationHashMixin({
      keys: ['selectedScope', 'selectedEntity'],
      type: 'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      rolesLoaded: false,
      rolesError: null,
      roles: null,
      clientsLoaded: false,
      clientsError: null,
      clients: null,
      selectedScope: '',
      selectedEntity: '',
      scopeSearchTerm: '',
      entitySearchMode: 'Has Scope'
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load() {
    // Creates state properties:
    // - rolesLoaded
    // - rolesError
    // - roles
    // - clientsLoaded
    // - clientsError
    // - clients
    return {
      roles: this.auth.listRoles(),
      clients: this.auth.listClients()
    };
  },

  /** Render user-interface */
  render() {
    return (
      this.renderWaitFor('roles') ||
      this.renderWaitFor('clients') ||
      this.renderSelectedEntity() ||
      this.renderSelectedScope() ||
      this.renderScopes()
    );
  },

  renderSelectedEntity() {
    const { selectedEntity } = this.state;

    if (selectedEntity === '') {
      return;
    }

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={1}>
              <Button onClick={this.clearSelectedEntity}>
                <Glyphicon glyph="chevron-left"/> Back
              </Button>
            </Col>
            <Col md={11}>
              <div style={{ fontSize: '26px' }}>
                {selectedEntity.split(':')[0]}: <code>{selectedEntity.split(':')[1]}</code>
              </div>
            </Col>
          </Row>
          {
            _.startsWith(this.state.selectedEntity, 'role:') ? (
              <RoleEditor
                currentRoleId={this.state.selectedEntity.slice('role:'.length)}
                reloadRoleId={this.reload} />
            ) : (
              <ClientEditor
                currentClientId={this.state.selectedEntity.slice('client:'.length)}
                reloadClientId={this.reload} />
            )
          }
        </Col>
      </Row>
    );
  },

  clearSelectedEntity() {
    this.setState({ selectedEntity: '' });
  },

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
                <Glyphicon glyph="chevron-left"/> Back
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
                    pullRight
                    id="match">
                  <MenuItem key="1" onClick={this.setEntitySearchMode.bind(this, 'Exact')}>
                    <Glyphicon
                      glyph="ok"
                      style={mode === 'Exact' ? {} : { visibility: 'hidden' }} /> Exact
                  </MenuItem>
                  <MenuItem key="2" onClick={this.setEntitySearchMode.bind(this, 'Has Scope')}>
                    <Glyphicon
                      glyph="ok"
                     style={mode === 'Has Scope' ? {} : { visibility: 'hidden' }} /> Has Scope
                  </MenuItem>
                  <MenuItem key="3" onClick={this.setEntitySearchMode.bind(this, 'Has Sub-Scope')}>
                    <Glyphicon
                      glyph="ok"
                      style={mode === 'Has Sub-Scope' ? {} : { visibility: 'hidden' }} /> Has Sub-Scope
                  </MenuItem>
                </DropdownButton>
              </InputGroup>
            </Col>
          </Row>
          <Table condensed hover className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>
                  <format.Icon name="users" fixedWidth={true}/> Roles /
                  <format.Icon name="user"/> Clients
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={index} onClick={this.selectEntity.bind(this, `role:${role.roleId}`)}>
                  <td>
                    <format.Icon name="users" fixedWidth={true}/> <code>{role.roleId}</code>
                  </td>
                </tr>
              ))}
              {clients.map((client, index) => (
                <tr
                  key={index + roles.length}
                  onClick={this.selectEntity.bind(this, `client:${client.clientId}`)}>
                    <td>
                      <format.Icon name="user" fixedWidth={true}/> <code>{client.clientId}</code>
                    </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    );
  },

  selectEntity(value) {
    this.setState({
      selectedEntity: value
    });
  },

  selectedScopeChanged() {
    this.setState({
      selectedScope: findDOMNode(this.refs.selectedScope).value
    });
  },

  setEntitySearchMode(mode) {
    this.setState({ entitySearchMode: mode });
  },

  clearSelectedScope() {
    this.setState({ selectedScope: '' });
  },

  renderScopes() {
    let scopes = _.uniq(_.flatten(
      this.state.roles.map(role => role.expandedScopes),
      this.state.clients.map(client => client.expandedScopes)
    ));

    scopes.sort();
    scopes = scopes.filter(scope => _.includes(scope, this.state.scopeSearchTerm));
    return (
      <Row>
        <Col md={12}>
          <InputGroup>
            <InputGroup.Addon><Glyphicon glyph="search" /></InputGroup.Addon>
            <FormControl
              type="text"
              value={this.state.scopeSearchTerm}
              ref="scopeSearchTerm"
              onChange={this.scopeSearchTermChanged} />
            <InputGroup.Button>
              <Button onClick={this.clearScopeSearchTerm}>
                <Glyphicon glyph="remove"/> Clear
              </Button>
            </InputGroup.Button>
          </InputGroup>
          <Table condensed hover className="scopes-inspector-scopes-table">
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
  },

  scopeSearchTermChanged() {
    this.setState({
      scopeSearchTerm: findDOMNode(this.refs.scopeSearchTerm).value
    });
  },

  clearScopeSearchTerm() {
    this.setState({
      scopeSearchTerm: ''
    });
  },

  /** Render row with scope */
  renderScopeRow(scope, index) {
    const isSelected = (this.state.selectedScope === scope);

    return (
      <tr
        key={index}
        className={isSelected ? 'info' : ''}
        onClick={this.selectScope.bind(this, scope)}>
          <td><code>{scope}</code></td>
      </tr>
    );
  },

  selectScope(scope) {
    this.setState({ selectedScope: scope });
  }
});
