import React, { Component } from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
import path from 'path';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import RoleEditor from './roleeditor';
import { TaskClusterEnhance } from '../../lib/utils';

import './rolemanager.less';

/** Create role manager */
class RoleManager extends Component {
  constructor(props) {
    super(props);

    const selectedRoleId = this.props.match.params.roleId ?
      decodeURIComponent(this.props.match.params.roleId) :
      '';

    this.state = {
      rolesLoaded: false,
      rolesError: undefined,
      roles: undefined,
      selectedRoleId   // '' means "add new role"
    };

    this.reloadRoleId = this.reloadRoleId.bind(this);
    this.renderRoleRow = this.renderRoleRow.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  /** Load state from auth (using TaskClusterMixin) */
  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // Creates state properties:
    // - rolesLoaded
    // - rolesError
    // - roles
    this.props.loadState({ roles: this.props.clients.auth.listRoles() });
  }

  /** Render user-interface */
  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <Col md={5}>
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              onClick={() => this.selectRoleId('')}
              disabled={this.state.selectedRoleId === ''}>
              <Glyphicon glyph="plus" /> Add Role
            </Button>
            <Button
              bsStyle="success"
              onClick={this.load}
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
  }

  /** Render table of all roles */
  renderRolesTable() {
    return this.props.renderWaitFor('roles') || (this.state.roles && (
      <Table condensed={true} hover={true} className="role-manager-role-table">
        <thead>
          <tr>
            <th>RoleId</th>
          </tr>
        </thead>
        <tbody>
          {this.state.roles.map(this.renderRoleRow)}
        </tbody>
      </Table>
    ));
  }

  /** Render row with role */
  renderRoleRow(role, index) {
    const isSelected = this.state.selectedRoleId === role.roleId;

    return (
      <tr
        key={index}
        className={isSelected ? 'info' : undefined}
        onClick={() => this.selectRoleId(role.roleId)}>
        <td><code>{role.roleId}</code></td>
      </tr>
    );
  }

  async reloadRoleId(roleId) {
    // Load role ignore errors (assume role doesn't exist)
    const role = await this.props.clients.auth.role(roleId);
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
  }

  selectRoleId(roleId) {
    this.props.history.push(path.join('/auth/roles', encodeURIComponent(roleId)));
    this.setState({ selectedRoleId: roleId });
  }
}

const taskclusterOpts = {
  clients: { auth: taskcluster.Auth },
  name: RoleManager.name
};

export default TaskClusterEnhance(RoleManager, taskclusterOpts);
