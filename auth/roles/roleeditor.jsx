var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var utils           = require('../../lib/utils');
var format          = require('../../lib/format');
var _               = require('lodash');
var ConfirmAction   = require('../../lib/ui/confirmaction');
var Promise         = require('promise');
var ScopeEditor     = require('../../lib/ui/scopeeditor');


/** Create role editor/viewer (same thing) */
var RoleEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      },
      reloadOnProps: ['currentRoleId']
    })
  ],

  propTypes: {
    // Method to reload a role in the parent
    reloadRoleId:  React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      currentRoleId:  ''     // '' implies. "Create Role"
    };
  },

  getInitialState() {
    return {
      // Loading role or loaded role
      roleLoaded:       false,
      roleError:        undefined,
      role:             undefined,
      // Edit or viewing current state
      editing:          true,
      // Operation details, if currently doing anything
      working:          false,
      error:            null
    };
  },

  /** Load initial state */
  load() {
    // If there is no currentRoleId, we're creating a new role
    if (this.props.currentRoleId === '') {
      return {
        role: {
          roleId:         '',
          scopes:         [],
          description:    ""
        },
        editing:          true,
        working:          false,
        error:            null
      };
    } else {
      // Load currentRoleId
      return {
        role:             this.auth.role(this.props.currentRoleId),
        editing:          false,
        working:          false,
        error:            null
      };
    }
  },

  render() {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>&nbsp;
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = this.props.currentRoleId === '';
    var isEditing           = (isCreating || this.state.editing);
    var title               = "Create New Role";
    if (!isCreating) {
      title = (isEditing ? "Edit Role" : "View Role");
    }
    try {
    return this.renderWaitFor('role') || (
      <span className="role-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          {
            isCreating ? (
              <bs.Input
                type="text"
                ref="roleId"
                value={this.state.role.roleId}
                bsStyle={this.validRoleId() ? 'success' : 'error'}
                hasFeedback
                label="RoleId"
                labelClassName="col-md-3"
                wrapperClassName="col-md-9"
                onChange={this.onChange}
                placeholder="RoleId"/>
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
            _.map({
              created: "Created",
              lastModified: "Last Modified",
            }, (label, prop) => {
              if (!this.state.role[prop]) {
                return undefined;
              }
              return (
                <div className="form-group" key={prop}>
                  <label className="control-label col-md-3">{label}</label>
                  <div className="col-md-9">
                    <div className="form-control-static">
                      <format.DateView date={this.state.role[prop]}/>
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
            this.state.role.expandedScopes ? (
              <div className="form-group">
                <label className="control-label col-md-3">
                  Expanded Scopes
                </label>
                <div className="col-md-9">
                  <ScopeEditor scopes={this.state.role.expandedScopes}/>
                </div>
              </div>
            ) : undefined
          }
          <hr/>
          <div className="form-group">
            <div className="col-md-9 col-md-offset-3">
              <div className="form-control-static">
                {
                  isEditing ?
                    (isCreating ?
                        this.renderCreatingToolbar()
                      :
                        this.renderEditingToolbar()
                    )
                  :
                    <bs.ButtonToolbar>
                      <bs.Button bsStyle="success"
                                 onClick={this.startEditing}
                                 disabled={this.state.working}>
                        <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Role
                      </bs.Button>
                    </bs.ButtonToolbar>
                }
              </div>
            </div>
          </div>
        </div>
      </span>
    );
    } catch(e) {
      console.log(e);
    }
  },

  /** Determine if roleId is valid */
  validRoleId() {
    return (this.state.role.roleId || '').length > 0;
  },

  /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
                   onClick={this.saveRole}
                   disabled={this.state.working}>
          <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
        </bs.Button>
        <ConfirmAction
          buttonStyle='danger'
          glyph='trash'
          disabled={this.state.working}
          label="Delete Role"
          action={this.deleteRole}
          success="Role deleted">
          Are you sure you want to delete role with roleId&nbsp;
          <code>{this.state.role.roleId}</code>?
        </ConfirmAction>
      </bs.ButtonToolbar>
    );
  },

  /** Render creation toolbar */
  renderCreatingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.createRole}
                   disabled={this.state.working || !this.validRoleId()}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Role
        </bs.Button>
      </bs.ButtonToolbar>
    );
  },

  /** Render description editor */
  renderDescEditor() {
    return (
      <textarea className="form-control"
                ref="description"
                value={this.state.role.description}
                onChange={this.onChange}
                rows={8}
                placeholder="Description in markdown...">
      </textarea>
    );
  },

  /** Render description */
  renderDesc() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.role.description}</format.Markdown>
      </div>
    );
  },

  /** Handle changes in the editor */
  onChange() {
    var state = _.cloneDeep(this.state);
    state.role.description = this.refs.description.getDOMNode().value;
    if (this.refs.roleId) {
      state.role.roleId = this.refs.roleId.getValue();
    }
    this.setState(state);
  },

  /** Add scope to state */
  scopesUpdated(scopes) {
    var role = _.cloneDeep(this.state.role);
    role.scopes = scopes;
    this.setState({role});
  },

  /** Start editing */
  startEditing() {
    this.setState({editing: true});
  },

  /** Create new role */
  async createRole() {
    this.setState({working: true});
    try {
      let roleId = this.state.role.roleId;
      let role = await this.auth.createRole(roleId, {
        description:  this.state.role.description,
        scopes:       this.state.role.scopes,
      });
      this.setState({
        role:           role,
        editing:        false,
        working:        false,
        error:          null,
      });
      this.props.reloadRoleId(roleId);
    } catch (err) {
      this.setState({
        working:  false,
        error:    err
      });
    }
  },

  /** Save current role */
  saveRole() {
    let roleId = this.state.role.roleId;
    this.loadState({
      role: this.auth.updateRole(roleId, {
        description:  this.state.role.description,
        scopes:       this.state.role.scopes,
      }).then(role => {
        this.props.reloadRoleId(roleId);
        return role;
      }),
      editing: false
    });
  },

  /** Delete current role */
  async deleteRole() {
    let roleId = this.state.role.roleId;
    await this.auth.deleteRole(roleId);
    await this.props.reloadRoleId(roleId);
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working:      false,
      error:        null
    });
  }
});

// Export RoleEditor
module.exports = RoleEditor;

