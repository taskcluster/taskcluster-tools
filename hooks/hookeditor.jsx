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
  schedule: ['0 * * * * *'],
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
      reloadOnProps: ['currentHookId', 'currentHookGroupId']
    })
  ],

  propTypes: {
    // Method to refresh hook list
    refreshHookList:  React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      currentHookId:        undefined,     // undefined implies. "Create Hook"
      currentHookGroupId:   undefined,
      initialHookValue:     JSON.stringify(initialHook, null, '\t')
    };
  },

  getInitialState: function() {
    return {
      definition:        undefined,
      // Currently loaded hook
      hookLoaded:        false,
      hookError:         undefined,
      hook:              null,
      // Submitted task
      createdTaskLoaded: false,
      createdTaskError:  undefined,
      createdTask:       null,
      // Edit or viewing current state
      editing:           true,
      // Operation details, if currently doing anything
      working:           false,
      error:             null,
    };
  },

  /** Load initial state */
  load: function() {
    // Create a new hook if we don't have the hookGroupId and hookId
    if (!this.props.currentHookId || !this.props.currentHookGroupId) {
      // Parametrization of a few field, to satisfy the task field
      var hook     = JSON.parse(this.props.initialHookValue);
      var deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 60);
      hook.task.deadline = deadline.toJSON();
      hook.task.created = new Date().toJSON();

      return {
        hook:       hook,
        editing:    true,
        definition: undefined,
        working:    false,
        error:      null
      };
    } else {
      // Load currentClientId
      hook = this.hooks.hook(this.props.currentHookGroupId, this.props.currentHookId).then(
        h => { delete h.hookId; delete h.hookGroupId; return h });
      return {
        hook:       hook,
        editing:    false,
        definition: undefined,
        working:    false,
        error:      null
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
    var isCreating          = (!this.props.currentHookId ||
                               !this.props.currentHookGroupId);
    var isEditing           = (isCreating || this.state.editing);
    var title               = isCreating ? "Create Hook" :
                              isEditing ? "Edit Hook" : "View Hook";
    return this.renderWaitFor('hook') || (
      <span className="hook-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-2">hookGroupId</label>
            <div className="col-md-10">
              {
                isCreating ?
                  <input type="text"
                    className="form-control"
                    ref="hookGroupId"
                    value={this.props.currentHookGroupId}
                    onChange={this.onNameChange}
                    placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.props.currentHookGroupId}
                    </div>
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">hookId</label>
            <div className="col-md-10">
              {
                isCreating ?
                  <input type="text"
                    className="form-control"
                    ref="hookId"
                    value={this.props.currentHookId}
                    onChange={this.onNameChange}
                    placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.props.currentHookId}
                    </div>
              }
            </div>
          </div>
          <pre>currentHookGroupId: {this.props.currentHookGroupId}</pre>
          <pre>currentHookId: {this.props.currentHookId}</pre>
        </div>
        {this.renderEditor()}
        {
          isEditing ? (
            isCreating ?
              this.renderCreatingToolbar() :
              this.renderEditingToolbar()
          ) :
            <bs.ButtonToolbar>
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
          buttonStyle='danger'
          glyph='trash'
          disabled={this.state.working}
          label="Delete Hook"
          action={this.deleteHook}
          success="Hook deleted">
          Are you sure you want to delete hook under&nbsp;
          <code>{this.props.currentHookGroupId + '/' + this.state.hook.hookId}</code>?
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
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Hook
        </bs.Button>
      </bs.ButtonToolbar>
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
        value={this.state.definition || this.editorHookJSON()}
        onChange={this.onHookChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="neat"/>
    </span>
    );
  },

  /** Create the visible JSON for the editor */
  editorHookJSON: function() {
    this.state.definition = JSON.stringify(this.state.hook, null, '\t');
    return this.state.definition;
  },

  onNameChange: function(e) {
    this.props.currentHookGroupId = this.refs.hookGroupId.getDOMNode().value;
    this.props.currentHookId = this.refs.hookId.getDOMNode().value;
    console.log("onc", this.props);
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

    // add hookId and hookGroupId to the hook, since they are required
    // by the schema
    var hook = _.cloneDeep(this.state.hook);
    hook.hookGroupId = this.refs.hookGroupId.getDOMNode().value;
    hook.hookId = this.refs.hookId.getDOMNode().value;

    this.hooks.createHook(
      hook.hookGroupId,
      hook.hookId,
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
    this.hooks.updateHook(
      this.state.hook.hookGroupId,
      this.state.hook.hookId,
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

  /** Delete current hook */
  async deleteHook() {
    await this.hooks.removeHook(this.props.currentHookGroupId, this.props.currentHookId);
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
