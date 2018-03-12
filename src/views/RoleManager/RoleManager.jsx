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

  navigate = roleId => {
    this.load();
    const { history } = this.props;

    history.push(`/auth/roles${roleId ? `/encodeURIComponent(roleId)` : ''}`);
  };

  handleDeleteRole = roleId => this.props.auth.deleteRole(roleId);

  renderRoleRow = (role, roleRow) => (
    <tr key={`${roleRow}-${role.id}`}>
      <td>
        <Link to={`/auth/roles/${encodeURIComponent(role.roleId)}`}>
          <code>{role.roleId}</code>
        </Link>
      </td>
    </tr>
  );

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

  renderRoles() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Role Manager" />
        <Col md={12}>
          {this.renderRolesTable()}
          <ButtonToolbar>
            <Link to="/auth/roles/create">
              <Button bsStyle="primary">
                <Glyphicon glyph="plus" /> Add Role
              </Button>
            </Link>
            <Button
              bsStyle="success"
              onClick={this.handleLoad}
              disabled={!this.state.roles}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
      </Row>
    );
  }

  renderRoleEditor() {
    return (
      <RoleEditor
        auth={this.props.auth}
        history={this.props.history}
        currentRoleId={this.props.roleId === 'create' ? '' : this.props.roleId}
        onDeleteRole={this.handleDeleteRole}
        navigate={this.navigate}
      />
    );
  }

  render() {
    return this.props.roleId ? this.renderRoleEditor() : this.renderRoles();
  }
}
