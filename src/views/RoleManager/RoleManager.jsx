import { PureComponent } from 'react';
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

export default class RoleManager extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      roles: null,
      error: null
    };
  }

  componentWillMount() {
    this.handleLoad();
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.state.error &&
      !equal(nextProps.userSession, this.props.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  handleLoad = async () => {
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

  handleNavigate = roleId => {
    this.handleLoad();
    this.props.history.replace(
      `/auth/roles/${roleId ? encodeURIComponent(roleId) : ''}`
    );
  };

  handleDeleteRole = roleId => this.props.auth.deleteRole(roleId);

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
      <Table condensed hover className="role-manager-role-table">
        <thead>
          <tr>
            <th>RoleId</th>
          </tr>
        </thead>
        <tbody>
          {this.state.roles
            .sort((a, b) => a.roleId.localeCompare(b.roleId))
            .map(this.renderRoleRow)}
        </tbody>
      </Table>
    );
  }

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Role Manager" />
        <Col md={5}>
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              href="/auth/roles"
              disabled={this.props.roleId === ''}>
              <Glyphicon glyph="plus" /> Add Role
            </Button>
            <Button
              bsStyle="success"
              onClick={this.handleLoad}
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
            onDeleteRole={this.handleDeleteRole}
            onNavigate={this.handleNavigate}
          />
        </Col>
      </Row>
    );
  }
}
