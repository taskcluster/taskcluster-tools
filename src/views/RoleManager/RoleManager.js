import React from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import RoleEditor from '../../components/RoleEditor';

export default class RoleManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      roles: null,
      error: null
    };
  }

  componentWillMount() {
    this.load();
  }

  async load() {
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
  }

  deleteRole = roleId => this.props.auth.deleteRole(roleId);

  renderRoleRow = (role, index) => {
    const isSelected = this.state.selectedRoleId === role.roleId;

    return (
      <tr key={index} className={isSelected ? 'info' : null}>
        <td>
          <Link to={`/auth/roles/${encodeURIComponent(role.roleId)}`}>
            <code>{role.roleId}</code>
          </Link>
        </td>
      </tr>
    );
  };

  renderRolesTable() {
    const { roles } = this.state;

    if (!roles) {
      return <Spinner />;
    }

    return (
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
    );
  }

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <Col md={5}>
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Button bsStyle="primary" href={'/auth/roles'} disabled={this.props.roleId === ''}>
              <Glyphicon glyph="plus" /> Add Role
            </Button>
            <Button bsStyle="success" onClick={this.load} disabled={!this.state.roles}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <RoleEditor
            auth={this.props.auth}
            currentRoleId={this.props.roleId}
            deleteRole={this.deleteRole}
            reloadRoles={this.load} />
        </Col>
      </Row>
    );
  }
}
