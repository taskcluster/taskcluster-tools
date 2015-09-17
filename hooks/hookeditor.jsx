var _               = require('lodash');
var bs              = require('react-bootstrap');
var CodeMirror      = require('react-code-mirror');
var ConfirmAction   = require('../lib/ui/confirmaction');
var debug           = require('debug')('hookeditor');
var format          = require('../lib/format');
var Promise         = require('promise');
var React           = require('react');
var taskcluster     = require('taskcluster-client');
var utils           = require('../lib/utils');

var initialHook = {
  metadata: {
    name: "Example Hook",
    description: "Description of what this hook does",
    owner: "name@example.com",
    emailOnError: true
  },
  schedule: {
    format: {
      type: "none",
    }
  },
  expires: "3 days",
  deadline: "60 minutes",
  task: {
    provisionerId:      'aws-provisioner-v1',
    workerType:         'b2gtest',
    created:            null, // later
    deadline:           null, // later
    payload: {
      image:            'ubuntu:13.10',
      command:          ['/bin/bash', '-c', 'echo "hello World"'],
      maxRunTime:       60 * 10
    },
    metadata: {
      name:             "Example Task",
      description:      "Markdown description of **what** this task does",
      owner:            "name@example.com",
      source:           "http://tools.taskcluster.net/task-creator/"
    }
  }
};

var reference = require('./reference');
/** Create hook editor/viewer (same thing) */
var HookEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.createClient(reference)
      },
      reloadOnProps: ['currentHookId', 'currentGroupId']
    })
  ],

  propTypes: {
    // Method to refresh hook list
    refreshHookList:  React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      currentHookId:    undefined,     // undefined implies. "Create Client"
      currentGroupId:   undefined,
      initialHookValue: JSON.stringify(initialHook, null, '\t')
    };
  },

  getInitialState: function() {
    return _.defaults({
      // Currently loaded hook
      hookLoaded:        false,
      hookError:         undefined,
      hook:              null,
      // View the current trigger token
      tokenLoaded:       false,
      tokenError:        undefined,
      token:             null,
      // Submitted task
      createdTaskLoaded: false,
      createdTaskError:  undefined,
      createdTask:       null,
      // Edit or viewing current state
      editing:           true,
      // Operation details, if currently doing anything
      working:           false,
      error:             null,
    });
  },

  /** Load initial state */
  load: function() {
    // Create a new hook if we don't have the groupId and hookId
    if (!this.props.currentHookId || !this.props.currentGroupId) {
      // Parametrization of a few field, to satisfy the task field
      var hook     = JSON.parse(this.props.initialHookValue);
      var deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 60);
      hook.task.deadline = deadline.toJSON();
      hook.task.created = new Date().toJSON();

      return {
        hook:       hook,
        groupId:    this.props.currentGroupId ? this.props.currentGroupId :  "",
        hookId:     this.props.currentHookId ? this.props.currentHookId :    "",
        definition: JSON.stringify(hook, null, '\t'),
        editing:    true,
        working:    false,
        error:      null
      };
    } else {
      // Load currentClientId
      return {
        hook:    this.hooks.hook(this.props.currentGroupId, this.props.currentHookId),
        groupId: this.props.currentGroupId,
        hookId:  this.props.currentHookId,
        token:   this.hooks.getTriggerToken(this.props.currentGroupId, this.props.currentHookId),
        editing: false,
        working: false,
        error:   null
      };
    }
  },

  render: function() {
    // Redirect if we've triggered a task
    if (this.state.createdTaskLoaded) {
      if (!this.state.createdTaskError && this.state.createdTask) {
        var link = '/task-inspector/#' + this.state.createdTask.status.taskId + '/';
        window.location = link;
        return (
          <bs.Col md={10} mdOffset={1}>
            <a href={link}>
              See&nbsp;
              <code>{this.state.createdTask}</code>
              &nbsp;in task inspector.
            </a>
          </bs.Col>
        );
      }
    }

    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = (!this.props.currentHookId ||
                               !this.props.currentGroupId);
    var isEditing           = (isCreating || this.state.editing);
    var title               = "Create New Hook";
    if (!isCreating) {
      title = (isEditing ? "Edit Hook" : "View Hook");
    }
    return this.renderWaitFor('hook') || (
      <span className="hook-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-1">GroupId</label>
            <div className="col-md-11">
              {
                isEditing ?
                  <input type="text"
                    className="form-control"
                    ref="groupId"
                    value={this.state.groupId}
                    onChange={this.onChange}
                    placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.groupId}
                    </div>
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-1">HookId</label>
            <div className="col-md-11">
              {
                isEditing ?
                  <input type="text"
                    className="form-control"
                    ref="hookId"
                    value={this.state.hookId}
                    onChange={this.onChange}
                    placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.hookId}
                    </div>
              }
            </div>
          </div>
        </div>
        {this.renderEditor()}
        {
          isEditing ? (
            isCreating ?
              this.renderCreatingToolbar() :
              this.renderEditingToolbar()
          ) :
            <bs.ButtonToolbar>
              <bs.Button bsStyle="primary"
                onClick={this.triggerHook}>
                <bs.Glyphicon glyph="ok"/>&nbsp;Trigger Hook
              </bs.Button>
              <bs.ModalTrigger modal={this.renderTokenModal()} ref="tokenModalTrigger">
                <bs.Button bsStyle="info">
                  Show Token
                </bs.Button>
              </bs.ModalTrigger>
              <bs.Button bsStyle="success"
                onClick={this.startEditing}
                disabled={this.state.working}>
                <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Hook
              </bs.Button>
            </bs.ButtonToolbar>
        }
      </span>
    );
  },

 /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
                   onClick={this.saveHook}
                   disabled={this.state.working || this.state.invalidHook}>
          <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
        </bs.Button>
        <ConfirmAction
          buttonStyle='warning'
          glyph='refresh'
          label="Reset Token"
          action={this.resetToken}
          success="Token has been reset">
          Are you sure you want to reset the token for this hook?
        </ConfirmAction>
        <ConfirmAction
          buttonStyle='danger'
          glyph='trash'
          disabled={this.state.working}
          label="Delete Client"
          action={this.deleteHook}
          success="Client deleted">
          Are you sure you want to delete hook under&nbsp;
          <code>{this.state.groupId + '/' + this.state.hookId}</code>?
        </ConfirmAction>
      </bs.ButtonToolbar>
    );
  },

  /** Render creation toolbar */
  renderCreatingToolbar: function() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.createHook}
                   disabled={this.state.working || this.state.invalidHook}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Client
        </bs.Button>
      </bs.ButtonToolbar>
    );
  },

  renderTokenModal() {
    return this.renderWaitFor('token') || (
      <bs.Modal title="Trigger Token">
        <div className="modal-body">
          Token: <code>{this.state.token.token}</code>
        </div>
        <div className="modal-footer">
          <bs.Button onClick={this.closeTokenModal}>Close</bs.Button>
        </div>
      </bs.Modal>
    );
  },

  /** Render task editor */
  renderEditor() {
    return (
      <span>
      <CodeMirror
        ref="editor"
        lineNumbers={true}
        mode="application/json"
        textAreaClassName={'form-control'}
        value={this.state.definition || JSON.stringify(this.state.hook, null, '\t')}
        onChange={this.onHookChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="neat"/>
    </span>
    );
  },

  onChange: function() {
    var state = _.cloneDeep(this.state);
    state.groupId = this.refs.groupId.getDOMNode().value;
    state.hookId = this.refs.hookId.getDOMNode().value;
    this.setState(state);
  },

  onHookChange: function(e) {
    var invalidHook = false;
    try {
      JSON.parse(e.target.value);
    }
    catch(err) {
      invalidHook = true;
    }
    this.setState({
      definition:  e.target.value,
      invalidHook: invalidHook
    });
  },

  /** Start editing */
  startEditing: function() {
    this.setState({editing: true});
  },

  /** Create new hook */
  createHook: function() {
    this.setState({working: true});
    var payload = JSON.parse(this.state.definition);
    this.hooks.createHook(
      this.state.groupId,
      this.state.hookId,
      payload
    ).then(function(hook) {
      this.setState({
        hook:    hook,
        editing: false,
        working: false,
        error:   null
      });
      this.props.refreshHookList();
    }.bind(this), function(err) {
      this.setState({
        working: false,
        error:   err
      });
    }.bind(this));
  },

  /** Save current hook */
  saveHook() {
    var payload = JSON.parse(this.state.definition);
    this.loadState({
      hook:    this.hooks.updateHook(this.state.groupId, this.state.hookId, payload),
      editing: false
    });
  },

  /** Delete current hook */
  async deleteHook() {
    await this.hooks.removeHook(this.props.currentGroupId, this.props.currentHookId);
    await Promise.all([this.props.refreshHookList(), this.reload()]);
  },

  triggerHook() {
    var status = this.hooks.triggerHook(this.props.currentGroupId, this.props.currentHookId);
    this.loadState({
      createdTask: status,
    });
  },

  /** Reset the current trigger token */
  async resetToken() {
    let token = await this.hooks.resetTriggerToken(this.props.currentGroupId, this.props.currentHookId);
    this.setState({
      token: token
    });
  },

  /** Close the token modal */
  closeTokenModal() {
    this.refs.tokenModalTrigger.hide();
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working:      false,
      error:        null
    });
  }
});

module.exports = HookEditor;
