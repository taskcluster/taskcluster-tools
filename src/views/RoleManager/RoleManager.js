import React from 'react';
import {
  Row,
  Col,
  ButtonToolbar,
  Button,
  Glyphicon,
  Table
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import equal from 'deep-equal';
import Spinner from '../../components/Spinner';
import RoleEditor from '../../components/RoleEditor';
import HelmetTitle from '../../components/HelmetTitle';

export default class RoleManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      roles: null,
      workerTypeContains: '',
      error: null
    };
  }

  componentWillMount() {
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.state.error &&
      !equal(nextProps.userSession, this.props.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  load = async () => {
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

  navigate = roleId => {
    this.load();
    this.props.history.replace(
      `/auth/roles/${roleId ? encodeURIComponent(roleId) : ''}`
    );
  };

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
          {this.state.roles
            .filter(workerType =>
              workerType.roleId.includes(this.state.workerTypeContains)
            )
            .sort((a, b) => a.roleId.localeCompare(b.roleId))
            .map(this.renderRoleRow)}
        </tbody>
      </Table>
    );
  }

  setWorkerType = e => this.setState({ workerTypeContains: e.target.value });

  enterWorkerType = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.setWorkerType(e);
    }
  };

  renderTypeInput() {
    return (
      <div className="form-group form-group-sm">
        <div className="input-group">
          <div className="input-group-addon text-sm">
            <em>RoleIds containing</em>
          </div>
          <input
            type="search"
            className="form-control"
            defaultValue={this.state.workerTypeContains}
            onBlur={this.setWorkerType}
            onKeyUp={this.enterWorkerType}
          />
          <div className="input-group-addon">
            <Glyphicon glyph="search" />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Role Manager" />
        <Col md={5}>
          {this.renderTypeInput()}
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              href={'/auth/roles'}
              disabled={this.props.roleId === ''}>
              <Glyphicon glyph="plus" /> Add Role
            </Button>
            <Button
              bsStyle="success"
              onClick={this.load}
              disabled={!this.state.roles}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <RoleEditor
            auth={this.props.auth}
            history={this.props.history}
            currentRoleId={this.props.roleId}
            deleteRole={this.deleteRole}
            navigate={this.navigate}
          />
        </Col>
      </Row>
    );
  }
}
