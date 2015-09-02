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

var initialTask = {
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
      currentHookId:  undefined,     // undefined implies. "Create Client"
      currentGroupId: undefined,
      localStorageKey: undefined,
      initialTaskValue: JSON.stringify(initialTask, null, '\t')
    };
  },

  getInitialState: function() {
    // Load from localStorage, otherwise initial task value
    var task = this.props.initialTaskValue;
    if (this.props.localStorageKey) {
      if (localStorage.getItem(this.props.localStorageKey)) {
        task = localStorage.getItem(this.props.localStorageKey);
        // Check if it'll parse
        try {
          JSON.parse(task);
        }
        catch(err) {
          task = this.props.initialTaskValue;
        }
      }
    }
    return _.defaults(this.parameterizeTask(task), {
      hookLoaded:     false,
      hookError:      undefined,
      hook:           undefined,
      // Edit or viewing current state
      editing:          true,
      // Operation details, if currently doing anything
      working:          false,
      error:            null
    });
  },

  /** Parameterize a task, return state after parameterization attempt */
  parameterizeTask(task) {
    // Assume the is valid JSON
    var invalidTask = false;

    // Parameterize with new deadline and created time
    try {
      var data      = JSON.parse(task);
      var deadline  = new Date();
      deadline.setMinutes(deadline.getMinutes() + 60);
      data.created  = new Date().toJSON();
      data.deadline = deadline.toJSON();
      task          = JSON.stringify(data, null, '\t');
    }
    catch (err) {
      debug("Failed to parameterize initial task, err: %s, %j",
            err, err, err.stack);
      invalidTask = true;
    }

    // Set task, and serialize to string after parameterization
    return {
      task:         task,
      invalidTask:  invalidTask
    };
  },

  /** Load initial state */
  load: function() {
    // Create a new hook if we don't have the groupId and hookId
    if (!this.props.currentHookId || !this.props.currentGroupId) {
      return {
        hook:            {
          groupId:         this.props.currentGroupId ? this.props.currentGroupId :  "",
          hookId:          this.props.currentHookId ? this.props.currentHookId :    "",
          deadline:        "",
          expires:         "",
          schedule:        "",
          metadata:        {
            name:          "",
            description:   "",
            owner:         "",
            emailOnError:  true
          },
          task:            initialTask
        },
        editing:           true,
        working:           false,
        error:             null
      };
    } else {
      // Load currentClientId
      var hookDef = this.hooks.hook(this.props.currentGroupId, this.props.currentHookId);
      return {
        hook:           hookDef,
        task:             JSON.stringify(hookDef.task, null, '\t'),
        invalidTask:      false,
        editing:          false,
        working:          false,
        error:            null
      };
    }
  },

  render: function() {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = (this.props.currentClientId === undefined ||
                               this.props.currentGroupId  === undefined);
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
            <label className="control-label col-md-3">GroupId</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="groupId"
                      value={this.state.hook.groupId}
                      onChange={this.onChange}
                      placeholder="groupId"/>
                  :
                    <div className="form-control-static">
                      {this.state.hook.groupId}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">HookId</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="hookId"
                      value={this.state.hook.hookId}
                      onChange={this.onChange}
                      placeholder="hookId"/>
                  :
                    <div className="form-control-static">
                      {this.state.hook.hookId}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Name</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="name"
                      value={this.state.hook.metadata.name}
                      onChange={this.onChange}
                      placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.hook.metadata.name}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Description</label>
            <div className="col-md-9">
              {isEditing ? this.renderDescEditor() : this.renderDesc()}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Task</label>
            <div className="col-md-9">
              { this.renderEditor() }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Expires</label>
            <div className="col-md-9">
              {
                isEditing ?
                  <input type="text"
                    className="form-control"
                    ref="expires"
                    value={this.state.hook.expires}
                    onChange={this.onChange}
                    placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.hook.expires}
                    </div>
                }
              </div>
            </div>
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
                          <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Client
                        </bs.Button>
                      </bs.ButtonToolbar>
                    }
                  </div>
                </div>
              </div>
            </div>
          </span>
    );
  },

 /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
                   onClick={this.saveHook}
                   disabled={this.state.working || this.state.invalidTask}>
          <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
        </bs.Button>
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
                   disabled={this.state.working || this.state.invalidTask}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Client
        </bs.Button>
      </bs.ButtonToolbar>
    );
  },

  /** Render description editor */
  renderDescEditor: function() {
    return (
      <textarea className="form-control"
                ref="description"
                value={this.state.hook.metadata.description}
                onChange={this.onChange}
                rows={8}
                placeholder="Description in markdown...">
      </textarea>
    );
  },

  /** Render description */
  renderDesc: function() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.hook.metadata.description}</format.Markdown>
      </div>
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
        value={this.state.task}
        onChange={this.onTaskChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="neat"/>
    </span>
    );
  },

  onTaskChange: function(e) {
    var invalidTask = false;
    try {
      JSON.parse(e.target.value);
    }
    catch(err) {
      invalidTask = true;
    }
    this.setState({
      task:         e.target.value,
      invalidTask:  invalidTask
    });
  },

  /** Handle changes in the editor */
  onChange: function() {
    var state = _.cloneDeep(this.state);
    state.hook.groupId               = this.refs.groupId.getDOMNode().value;
    state.hook.hookId                = this.refs.hookId.getDOMNode().value;
    state.hook.metadata.description  = this.refs.description.getDOMNode().value;
    state.hook.metadata.name         = this.refs.name.getDOMNode().value;
    state.hook.expires               = this.refs.expires.getDOMNode().value;
    this.setState(state);
  },

  /** When expires exchanges in the editor */
  onExpiresChange: function(date) {
    if (date instanceof Date) {
      var state = _.cloneDeep(this.state);
      state.hook.expires = date.toJSON();
      this.setState(state);
    }
  },

  /** Start editing */
  startEditing: function() {
    this.setState({editing: true});
  },

  /** Create the hook definition */
  createDefinition() {
    return {
      metadata: this.state.hook.metadata,
      task:     JSON.parse(this.state.task),
      deadline: this.state.hook.expires,
      expires:  this.state.hook.expires,
    };
  },

  /** Create new hook */
  createHook: function() {
    this.setState({working: true});
    this.hooks.createHook(
      this.state.hook.groupId,
      this.state.hook.hookId,
      this.createDefinition()
    ).then(function(hook) {
      this.setState({
        hook: hook,
        editing: false,
        working: false,
        error: null
      });
      this.props.refreshHookList();
      //this.reload();
    }.bind(this), function(err) {
      this.setState({
        working:  false,
        error:    err
      });
    }.bind(this));
  },

  /** Save current hook */
  saveHook() {
    this.loadState({
      hook: this.hooks.updateHook(
        this.state.hook.groupId,
        this.state.hook.hookId,
        this.createDefinition()
      ),
      editing: false
    });
  },

  /** Delete current hook */
  async deleteHook() {
    await this.hooks.removeHook(this.state.hook.groupId, this.state.hook.hookId);
    await Promise.all([this.props.refreshHookList(), this.reload()]);
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
