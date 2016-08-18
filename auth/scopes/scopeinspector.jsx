var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../../lib/format');
var _               = require('lodash');
var ReactDOM        = require('react-dom');
var RoleEditor      = require('../roles/roleeditor');
var ClientEditor    = require('../clients/clienteditor');

/** Define scope spector */
var ScopeInspector = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      }
    }),
    // Serialize selectedScope and selectedEntity to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['selectedScope', 'selectedEntity'],
      type:                   'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      rolesLoaded:      false,
      rolesError:       undefined,
      roles:            undefined,
      clientsLoaded:    false,
      clientsError:     undefined,
      clients:          undefined,
      selectedScope:    '',
      selectedEntity:   '',
      scopeSearchTerm:  '',
      entitySearchMode: 'Has Scope',
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
      roles:    this.auth.listRoles(),
      clients:  this.auth.listClients(),
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
    if (this.state.selectedEntity === "") {
      return undefined;
    }
    return (
      <bs.Row>
        <bs.Col md={12}>
          <bs.Row>
            <bs.Col md={1}>
              <bs.Button onClick={this.clearSelectedEntity}>
                <bs.Glyphicon glyph="chevron-left"/> Back
              </bs.Button>
            </bs.Col>
            <bs.Col md={11}>
              <div style={{fontSize: '26px'}}>
                {this.state.selectedEntity.split(':')[0]}:&nbsp;
                <code>{this.state.selectedEntity.split(':')[1]}</code>
              </div>
            </bs.Col>
          </bs.Row>
          {
            _.startsWith(this.state.selectedEntity, 'role:') ? (
              <RoleEditor
                currentRoleId={this.state.selectedEntity.slice('role:'.length)}
                reloadRoleId={this.reload}/>
            ) : (
              <ClientEditor
                currentClientId={this.state.selectedEntity.slice('client:'.length)}
                reloadClientId={this.reload}/>
            )
          }
        </bs.Col>
      </bs.Row>
    );
  },

  clearSelectedEntity() {
    this.setState({selectedEntity: ""});
  },

  renderSelectedScope() {
    if (this.state.selectedScope === "") {
      return undefined;
    }
    let mode = this.state.entitySearchMode;
    let match = () => true;
    if (mode === 'Exact') {
      match = scope => scope === this.state.selectedScope;
    }
    if (mode === 'Has Scope') {
      match = scope => {
        if (scope === this.state.selectedScope) {
          return true;
        }
        if (/\*$/.test(scope)) {
          return this.state.selectedScope.indexOf(scope.slice(0, -1)) === 0;
        }
        return false;
      };
    }
    if (mode === 'Has Sub-Scope') {
      let pattern = this.state.selectedScope;
      if (!/\*$/.test(pattern)) {
        pattern += "*"; // Otherwise this test doesn't make any sense
      }
      match = scope => {
        if (scope === pattern) {
          return true;
        }
        return scope.indexOf(pattern.slice(0, -1)) === 0;
      };
    }
    let clients = this.state.clients.filter(client => _.some(client.expandedScopes, match));
    let roles = this.state.roles.filter(role => _.some(role.expandedScopes, match));
    roles = _.sortBy(roles, 'roleId');
    clients = _.sortBy(clients, 'clientId');
    return (
      <bs.Row>
        <bs.Col md={12}>
          <bs.Row>
            <bs.Col md={1}>
              <bs.Button onClick={this.clearSelectedScope}>
                <bs.Glyphicon glyph="chevron-left"/> Back
              </bs.Button>
            </bs.Col>
            <bs.Col md={11}>
              <bs.InputGroup>
                <bs.InputGroup.Addon>Scope</bs.InputGroup.Addon>
                <bs.FormControl type="text"
                  value={this.state.selectedScope}
                  onChange={this.selectedScopeChanged}
                  ref='selectedScope'
                  />
                <bs.DropdownButton componentClass={bs.InputGroup.Button} title={"Match: " + mode} pullRight id='match'>
                  <bs.MenuItem key="1" onClick={this.setEntitySearchMode.bind(this, 'Exact')}>
                    <bs.Glyphicon glyph="ok"
                      style={mode === 'Exact' ? {} : {visibility: 'hidden'}}/>
                      &nbsp; Exact
                  </bs.MenuItem>
                  <bs.MenuItem key="2" onClick={this.setEntitySearchMode.bind(this, 'Has Scope')}>
                    <bs.Glyphicon glyph="ok"
                      style={mode === 'Has Scope' ? {} : {visibility: 'hidden'}}/>
                      &nbsp; Has Scope
                  </bs.MenuItem>
                  <bs.MenuItem key="3"  onClick={this.setEntitySearchMode.bind(this, 'Has Sub-Scope')}>
                    <bs.Glyphicon glyph="ok"
                      style={mode === 'Has Sub-Scope' ? {} : {visibility: 'hidden'}}/>
                      &nbsp; Has Sub-Scope
                  </bs.MenuItem>
                </bs.DropdownButton>
              </bs.InputGroup>
            </bs.Col>
          </bs.Row>
          <bs.Table condensed hover className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th><format.Icon name='users' fixedWidth={true}/> Roles / <format.Icon name='user'/> Clients</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => {
                return (
                  <tr key={index}
                      onClick={this.selectEntity.bind(this, 'role:' + role.roleId)}>
                    <td>
                      <format.Icon name='users' fixedWidth={true}/>&nbsp;
                      <code>{role.roleId}</code>
                    </td>
                  </tr>
                );
              })}
              {clients.map((client, index) => {
                return (
                  <tr key={index + roles.length}
                      onClick={this.selectEntity.bind(this, 'client:' + client.clientId)}>
                    <td>
                      <format.Icon name='user' fixedWidth={true}/>&nbsp;
                      <code>{client.clientId}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </bs.Table>
        </bs.Col>
      </bs.Row>
    );
  },

  selectEntity(value) {
    this.setState({
      selectedEntity: value,
    });
  },

  selectedScopeChanged() {
    this.setState({
      selectedScope: ReactDOM.findDOMNode(this.refs.selectedScope).value,
    });
  },

  setEntitySearchMode(mode) {
    this.setState({entitySearchMode: mode});
  },

  clearSelectedScope() {
    this.setState({selectedScope: ""});
  },

  renderScopes() {
    let scopes = _.uniq(_.flatten(
      this.state.roles.map(role => role.expandedScopes),
      this.state.clients.map(client => client.expandedScopes),
    ));
    scopes.sort()
    scopes = scopes.filter(scope => _.includes(scope, this.state.scopeSearchTerm));
    return (
      <bs.Row>
        <bs.Col md={12}>
          <bs.InputGroup>
            <bs.InputGroup.Addon><bs.Glyphicon glyph="search"/></bs.InputGroup.Addon>
            <bs.FormControl
              type="text" value={this.state.scopeSearchTerm}
              ref='scopeSearchTerm' onChange={this.scopeSearchTermChanged}/>
            <bs.InputGroup.Button>
              <bs.Button onClick={this.clearScopeSearchTerm}>
                <bs.Glyphicon glyph="remove"/> Clear
              </bs.Button>
            </bs.InputGroup.Button>
          </bs.InputGroup>
          <bs.Table condensed hover className="scopes-inspector-scopes-table">
            <thead>
              <tr>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>
              {scopes.map(this.renderScopeRow)}
            </tbody>
          </bs.Table>
        </bs.Col>
      </bs.Row>
    )
  },

  scopeSearchTermChanged(e) {
    this.setState({
      scopeSearchTerm: ReactDOM.findDOMNode(this.refs.scopeSearchTerm).value,
    });
  },

  clearScopeSearchTerm() {
    this.setState({
      scopeSearchTerm: '',
    });
  },

  /** Render row with scope */
  renderScopeRow(scope, index) {
    var isSelected = (this.state.selectedScope === scope);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectScope.bind(this, scope)}>
        <td><code>{scope}</code></td>
      </tr>
    );
  },

  selectScope(scope) {
    this.setState({selectedScope: scope});
  }
});

// Export ScopeInspector
module.exports = ScopeInspector;
