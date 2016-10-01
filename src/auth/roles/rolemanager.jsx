import React from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
import RoleEditor from './roleeditor';
import * as utils from '../../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../../lib/format';
import _ from 'lodash';

import './rolemanager.less';

/** Create role manager */
const RoleManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth: taskcluster.Auth
      }
    }),
    // Serialize state.selectedRoleId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['selectedRoleId'],
      type: 'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      rolesLoaded: false,
      rolesError: undefined,
      roles: undefined,
      selectedRoleId: ''   // '' means "add new role"
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load() {
    // Creates state properties:
    // - rolesLoaded
    // - rolesError
    // - roles
    return {
      roles: this.auth.listRoles()
    };
  },

  /** Render user-interface */
  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <Col md={5}>
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              onClick={this.selectRoleId.bind(this, '')}
              disabled={this.state.selectedRoleId === ''}>
                <Glyphicon glyph="plus" /> Add Role
            </Button>
            <Button
              bsStyle="success"
              onClick={this.reload}
              disabled={!this.state.rolesLoaded}>
                <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <RoleEditor currentRoleId={this.state.selectedRoleId} reloadRoleId={this.reloadRoleId} />
        </Col>
      </Row>
    );
  },

  /** Render table of all roles */
  renderRolesTable() {
    return this.renderWaitFor('roles') || (
      <Table condensed hover className="role-manager-role-table">
        <thead>
          <tr>
            <th>RoleId</th>
          </tr>
        </thead>
        <tbody>
          {this.state.roles.map(this.renderRoleRow)}
        </tbody>
      </Table>
    );
  },

  /** Render row with role */
  renderRoleRow(role, index) {
    const isSelected = (this.state.selectedRoleId === role.roleId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectRoleId.bind(this, role.roleId)}>
        <td><code>{role.roleId}</code></td>
      </tr>
    );
  },

  async reloadRoleId(roleId) {
    // Load role ignore errors (assume role doesn't exist)
    const role = await this.auth.role(roleId).catch(() => null);
    let selectedRoleId = roleId;
    let roles = _.cloneDeep(this.state.roles);
    const index = _.findIndex(roles, r => r.roleId === roleId);
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
    this.setState({ roles, selectedRoleId });
  },

  selectRoleId(roleId) {
    this.setState({ selectedRoleId: roleId });
  }
});

export default RoleManager;
