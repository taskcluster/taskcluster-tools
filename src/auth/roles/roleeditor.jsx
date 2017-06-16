import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import {
  Alert, ButtonToolbar, Button, Glyphicon, FormGroup, ControlLabel, FormControl
} from 'react-bootstrap';
import _ from 'lodash';
import taskcluster from 'taskcluster-client';
import { TaskClusterEnhance } from '../../lib/utils';
import * as format from '../../lib/format';
import ConfirmAction from '../../lib/ui/confirmaction';
import ScopeEditor from '../../lib/ui/scopeeditor';
import './roleeditor.less';

/** Create role editor/viewer (same thing) */
class RoleEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Loading role or loaded role
      roleLoaded: false,
      roleError: undefined,
      role: undefined,
      // Edit or viewing current state
      editing: true,
      // Operation details, if currently doing anything
      working: false,
      error: null
    };

    this.dismissError = this.dismissError.bind(this);
    this.onChange = this.onChange.bind(this);
    this.scopesUpdated = this.scopesUpdated.bind(this);
    this.startEditing = this.startEditing.bind(this);
    this.saveRole = this.saveRole.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
    this.createRole = this.createRole.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  /** Load initial state */
  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // If there is no currentRoleId, we're creating a new role
    if (this.props.currentRoleId === '') {
      return this.props.loadState({
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

    // Load currentRoleId
    this.props.loadState({
      role: this.props.clients.auth.role(this.props.currentRoleId),
      editing: false,
      working: false,
      error: null
    });
  }

  render() {
    // display errors from operations
    if (this.state.error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>&nbsp;
          {this.state.error.toString()}
        </Alert>
      );
    }

    const isCreating = this.props.currentRoleId === '';
    const isEditing = isCreating || this.state.editing;
    let title = 'Create New Role';

    if (!isCreating) {
      title = isEditing ? 'Edit Role' : 'View Role';
    }

    if (!this.state.role) {
      return this.props.renderWaitFor('role') ||  this.props.renderSpinner();
    }

    try {
      return (
        <div className="role-editor">
          <h4 style={{ marginTop: 0 }}>{title}</h4>
          <hr style={{ marginBottom: 10 }} />
          <div className="form-horizontal">
            {
              isCreating ? (
                <FormGroup validationState={this.validRoleId() ? 'success' : 'error'}>
                  <ControlLabel className="col-md-3">RoleId</ControlLabel>
                  <div className="col-md-9">
                    <FormControl
                      type="text"
                      ref="roleId"
                      placeholder="RoleId"
                      value={this.state.role.roleId}
                      onChange={this.onChange} />
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
              )
            }
            <div className="form-group">
              <label className="control-label col-md-3">Description</label>
              <div className="col-md-9">
                {isEditing ? this.renderDescEditor() : this.renderDesc()}
              </div>
            </div>
            {
              _.map({ created: 'Created', lastModified: 'Last Modified' }, (label, prop) => {
                if (!this.state.role[prop]) {
                  return;
                }

                return (
                  <div className="form-group" key={prop}>
                    <label className="control-label col-md-3">{label}</label>
                    <div className="col-md-9">
                      <div className="form-control-static">
                        <format.DateView date={this.state.role[prop]} />
                      </div>
                    </div>
                  </div>
                );
              })
            }
            <div className="form-group">
              <label className="control-label col-md-3">Scopes</label>
              <div className="col-md-9">
                <ScopeEditor
                  editing={isEditing}
                  scopes={this.state.role.scopes}
                  scopesUpdated={this.scopesUpdated} />
              </div>
            </div>
            {
              !isEditing && !isCreating && this.state.role.expandedScopes ? (
                <div className="form-group">
                  <label className="control-label col-md-3">
                    Expanded Scopes
                  </label>
                  <div className="col-md-9">
                    <ScopeEditor scopes={this.state.role.expandedScopes} />
                  </div>
                </div>
              ) :
                null
            }
            <hr />
            <div className="form-group">
              <div className="col-md-9 col-md-offset-3">
                <div className="form-control-static">
                  {(() => {
                    if (isEditing) {
                      return isCreating ?
                        this.renderCreatingToolbar() :
                        this.renderEditingToolbar();
                    }

                    return (
                      <ButtonToolbar>
                        <Button
                          bsStyle="success"
                          onClick={this.startEditing}
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
    } catch (e) {
      // TODO: Handle error
    }
  }

  /** Determine if roleId is valid */
  validRoleId() {
    return (this.state.role.roleId || '').length > 0;
  }

  /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <ButtonToolbar>
        <Button bsStyle="success" onClick={this.saveRole} disabled={this.state.working}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ConfirmAction
          buttonStyle="danger"
          glyph="trash"
          disabled={this.state.working}
          label="Delete Role"
          action={this.deleteRole}
          success="Role deleted">
          Are you sure you want to delete role with role ID <code>{this.state.role.roleId}</code>?
        </ConfirmAction>
      </ButtonToolbar>
    );
  }

  /** Render creation toolbar */
  renderCreatingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="primary"
          onClick={this.createRole}
          disabled={this.state.working || !this.validRoleId()}>
          <Glyphicon glyph="plus" /> Create Role
        </Button>
      </ButtonToolbar>
    );
  }

  /** Render description editor */
  renderDescEditor() {
    return (
      <textarea
        className="form-control"
        ref="description"
        value={this.state.role.description}
        onChange={this.onChange}
        rows={8}
        placeholder="Description in markdown..." />
    );
  }

  /** Render description */
  renderDesc() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.role.description}</format.Markdown>
      </div>
    );
  }

  /** Handle changes in the editor */
  onChange() {
    const state = _.cloneDeep(this.state);

    state.role.description = findDOMNode(this.refs.description).value;

    if (this.refs.roleId) {
      state.role.roleId = findDOMNode(this.refs.roleId).value;
    }

    this.setState(state);
  }

  /** Add scope to state */
  scopesUpdated(scopes) {
    const role = _.cloneDeep(this.state.role);

    role.scopes = scopes;

    this.setState({ role });
  }

  /** Start editing */
  startEditing() {
    this.setState({ editing: true });
  }

  /** Create new role */
  async createRole() {
    this.setState({ working: true });

    try {
      const roleId = this.state.role.roleId;
      const role = await this.props.clients.auth.createRole(roleId, {
        description: this.state.role.description,
        scopes: this.state.role.scopes
      });

      this.setState({
        role,
        editing: false,
        working: false,
        error: null
      });

      this.props.reloadRoleId(roleId);
    } catch (err) {
      this.setState({
        working: false,
        error: err
      });
    }
  }

  /** Save current role */
  saveRole() {
    const roleId = this.state.role.roleId;

    this.props.loadState({
      editing: false,
      role: this.props.clients.auth
        .updateRole(roleId, {
          description: this.state.role.description,
          scopes: this.state.role.scopes
        })
        .then(role => {
          this.props.reloadRoleId(roleId);
          return role;
        })
    });
  }

  /** Delete current role */
  async deleteRole() {
    const roleId = this.state.role.roleId;

    await this.props.clients.auth.deleteRole(roleId);
    await this.props.reloadRoleId(roleId);
  }

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working: false,
      error: null
    });
  }
}

RoleEditor.propTypes = {
  // Method to reload a role in the parent
  reloadRoleId: React.PropTypes.func.isRequired
};

RoleEditor.defaultProps = {
  // '' implies. "Create Role"
  currentRoleId: ''
};

const taskclusterOpts = {
  clients: { auth: taskcluster.Auth },
  reloadOnProps: ['currentRoleId'],
  name: RoleEditor.name
};

export default TaskClusterEnhance(RoleEditor, taskclusterOpts);
