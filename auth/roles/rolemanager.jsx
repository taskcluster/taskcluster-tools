var React           = require('react');
var bs              = require('react-bootstrap');
var RoleEditor      = require('./roleeditor');
var utils           = require('../../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../../lib/format');
var _               = require('lodash');

/** Create role manager */
var RoleManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      }
    }),
    // Serialize state.selectedRoleId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['selectedRoleId'],
      type:                   'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      rolesLoaded:      false,
      rolesError:       undefined,
      roles:            undefined,
      selectedRoleId:   ''   // '' means "add new role"
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load() {
    // Creates state properties:
    // - rolesLoaded
    // - rolesError
    // - roles
    return {
      roles:    this.auth.listRoles()
    };
  },

  /** Render user-interface */
  render() {
    return (
      <bs.Row>
        <bs.Col md={6}>
          {this.renderRolesTable()}
          <bs.ButtonToolbar>
            <bs.Button bsStyle="primary"
                       onClick={this.selectRoleId.bind(this, '')}
                       disabled={this.state.selectedRoleId === ''}>
              <bs.Glyphicon glyph="plus"/>
              &nbsp;
              Add Role
            </bs.Button>
            <bs.Button bsStyle="success"
                       onClick={this.reload}
                       disabled={!this.state.rolesLoaded}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
        <bs.Col md={6}>
          <RoleEditor currentRoleId={this.state.selectedRoleId}
                      reloadRoleId={this.reloadRoleId}/>
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render table of all roles */
  renderRolesTable() {
    return this.renderWaitFor('roles') || (
      <bs.Table condensed hover className="role-manager-role-table">
        <thead>
          <tr>
            <th>RoleId</th>
            <th>Created</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          {this.state.roles.map(this.renderRoleRow)}
        </tbody>
      </bs.Table>
    );
  },

  /** Render row with role */
  renderRoleRow(role, index) {
    var isSelected = (this.state.selectedRoleId === role.roleId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectRoleId.bind(this, role.roleId)}>
        <td><code>{role.roleId}</code></td>
        <td><format.DateView date={role.created}/></td>
        <td><format.DateView date={role.lastModified}/></td>
      </tr>
    );
  },

  async reloadRoleId(roleId) {
    // Load role ignore errors (assume role doesn't exist)
    let role = await this.auth.role(roleId).catch(() => null);
    let selectedRoleId = roleId;
    let roles = _.cloneDeep(this.state.roles);
    var index = _.findIndex(roles, r => r.roleId === roleId);
    if (index === -1 && role !== null) {
      roles.push(role);
    } else if (role !== null) {
      roles[index] = role;
    } else {
      roles = roles.filter(r => r.roleId !== roleId);
    }
    if (_.findIndex(roles, r => r.roleId === selectedRoleId) === -1) {
      selectedRoleId = '';
    }
    roles.sort((a, b) => a.roleId > b.roleId);
    this.setState({roles, selectedRoleId});
  },

  selectRoleId(roleId) {
    this.setState({selectedRoleId: roleId});
  }
});

// Export RoleManager
module.exports = RoleManager;
