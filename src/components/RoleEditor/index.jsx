import { PureComponent } from 'react';
import { func } from 'prop-types';
import {
  ButtonToolbar,
  Button,
  Glyphicon,
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap';
import { assoc } from 'ramda';
import Icon from 'react-fontawesome';
import Spinner from '../Spinner';
import ScopeEditor from '../ScopeEditor';
import DateView from '../DateView';
import Markdown from '../Markdown';
import ModalItem from '../ModalItem';
import Error from '../../components/Error';
import UserSession from '../../auth/UserSession';

export default class RoleEditor extends PureComponent {
  static propTypes = {
    // Method to reload a role in the parent
    onNavigate: func,
    onDeleteRole: func.isRequired
  };

  static defaultProps = {
    // '' implies. "Create Role"
    currentRoleId: '',
    onNavigate: null
  };

  constructor(props) {
    super(props);

    this.state = {
      // Loading role or loaded role
      role: null,
      // Edit or viewing current state
      editing: true,
      // Operation details, if currently doing anything
      working: false,
      error: null
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (!nextProps.currentRoleId !== this.props.currentRoleId) {
      this.load(nextProps);
    }
  }

  load = async props => {
    // If there is no currentRoleId, we're creating a new role
    if (props.currentRoleId === '') {
      return this.setState({
        role: {
          roleId: '',
          scopes: [],
          description: ''
        },
        editing: true,
        working: false,
        error: null
      });
    }

    try {
      this.setState({
        role: await props.auth.role(props.currentRoleId),
        editing: false,
        working: false,
        error: null
      });
    } catch (err) {
      this.setState({
        error: err,
        role: null
      });
    }
  };

  validRoleId = () => (this.state.role.roleId || '').length > 0;

  handleRoleIdChange = e =>
    this.setState({
      role: assoc('roleId', e.target.value, this.state.role)
    });

  handleDescriptionChange = e =>
    this.setState({
      role: assoc('description', e.target.value, this.state.role)
    });

  handleScopesUpdated = scopes =>
    this.setState({
      role: assoc('scopes', scopes, this.state.role)
    });

  handleStartEditing = () => this.setState({ editing: true });

  handleCreateRole = async () => {
    this.setState({ working: true });

    try {
      const { roleId } = this.state.role;
      const role = await this.props.auth.createRole(roleId, {
        description: this.state.role.description,
        scopes: this.state.role.scopes
      });

      this.setState(
        {
          role,
          editing: false,
          working: false,
          error: null
        },
        () => this.props.onNavigate(roleId)
      );
    } catch (err) {
      this.setState({
        working: false,
        error: err
      });
    }
  };

  handleSaveRole = async () => {
    const { roleId } = this.state.role;

    try {
      this.setState({
        editing: false,
        role: await this.props.auth.updateRole(roleId, {
          description: this.state.role.description,
          scopes: this.state.role.scopes
        })
      });
    } catch (err) {
      this.setState({
        error: err
      });
    }
  };

  renderEditingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="success"
          onClick={this.handleSaveRole}
          disabled={this.state.working}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ModalItem
          button
          bsStyle="danger"
          disabled={this.state.working}
          onSubmit={() => this.props.onDeleteRole(this.state.role.roleId)}
          onComplete={this.props.onNavigate}
          body={
            <span>
              Are you sure you want to delete role with role ID{' '}
              <code>{this.state.role.roleId}</code>?
            </span>
          }>
          <Icon name="trash" /> Delete Role
        </ModalItem>
      </ButtonToolbar>
    );
  }

  renderCreatingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="primary"
          onClick={this.handleCreateRole}
          disabled={this.state.working || !this.validRoleId()}>
          <Glyphicon glyph="plus" /> Create Role
        </Button>
      </ButtonToolbar>
    );
  }

  renderDescEditor() {
    return (
      <textarea
        className="form-control"
        value={this.state.role.description}
        onChange={this.handleDescriptionChange}
        rows={8}
        placeholder="Description in markdown..."
      />
    );
  }

  renderDesc() {
    return (
      <div className="form-control-static">
        <Markdown>{this.state.role.description}</Markdown>
      </div>
    );
  }

  render() {
    const isCreating = this.props.currentRoleId === '';
    const isEditing = isCreating || this.state.editing;
    let title = 'Create New Role';

    if (!isCreating) {
      title = isEditing ? 'Edit Role' : 'View Role';
    }

    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    if (!this.state.role) {
      return <Spinner />;
    }

    return (
      <div className="role-editor">
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <hr style={{ marginBottom: 10 }} />
        <div className="form-horizontal">
          {isCreating ? (
            <FormGroup
              validationState={this.validRoleId() ? 'success' : 'error'}>
              <ControlLabel className="col-md-3">RoleId</ControlLabel>
              <div className="col-md-9">
                <FormControl
                  type="text"
                  placeholder="RoleId"
                  value={this.state.role.roleId}
                  onChange={this.handleRoleIdChange}
                />
                <FormControl.Feedback />
              </div>
            </FormGroup>
          ) : (
            <div className="form-group">
              <label className="control-label col-md-3">RoleId</label>
              <div className="col-md-9">
                <div className="form-control-static">
                  <code>{this.state.role.roleId}</code>
                </div>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="control-label col-md-3">Description</label>
            <div className="col-md-9">
              {isEditing ? this.renderDescEditor() : this.renderDesc()}
            </div>
          </div>
          {Object.entries({ created: 'Created', lastModified: 'Last Modified' })
            .map(([prop, label]) => {
              if (!this.state.role[prop]) {
                return null;
              }

              return (
                <div className="form-group" key={prop}>
                  <label className="control-label col-md-3">{label}</label>
                  <div className="col-md-9">
                    <div className="form-control-static">
                      <DateView date={this.state.role[prop]} />
                    </div>
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
          <div className="form-group">
            <label className="control-label col-md-3">Scopes</label>
            <div className="col-md-9">
              <ScopeEditor
                editing={isEditing}
                scopes={this.state.role.scopes}
                onScopesUpdated={this.handleScopesUpdated}
              />
            </div>
          </div>
          {!isEditing &&
          !isCreating &&
          this.state.role.expandedScopes &&
          !this.state.role.roleId.endsWith('*') ? (
            <div className="form-group">
              <label className="control-label col-md-3">Expanded Scopes</label>
              <div className="col-md-9">
                <ScopeEditor scopes={this.state.role.expandedScopes} />
              </div>
            </div>
          ) : null}
          <hr />
          <div className="form-group">
            <div className="col-md-9 col-md-offset-3">
              <div className="form-control-static">
                {(() => {
                  if (isEditing) {
                    return isCreating
                      ? this.renderCreatingToolbar()
                      : this.renderEditingToolbar();
                  }

                  return (
                    <ButtonToolbar>
                      <Button
                        bsStyle="success"
                        onClick={this.handleStartEditing}
                        disabled={this.state.working}>
                        <Glyphicon glyph="pencil" /> Edit Role
                      </Button>
                    </ButtonToolbar>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
