var _               = require('lodash');
var bs              = require('react-bootstrap');
var ConfirmAction   = require('../lib/ui/confirmaction');
var CodeMirror      = require('react-code-mirror');
var debug           = require('debug')('hookeditor');
var format          = require('../lib/format');
var Promise         = require('promise');
var React           = require('react');
var taskcluster     = require('taskcluster-client');
var utils           = require('../lib/utils');

// Load javascript mode for CodeMirror
require('codemirror/mode/javascript/javascript');
require('../lib/codemirror/json-lint');

var initialHook = {
  metadata: {
    name: "Example Hook",
    description: "Description of what this hook does",
    owner: "name@example.com",
    emailOnError: true
  },
  schedule: [],
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

// some of the API functions return hook descriptions containing hookId
// and hookGroupId, but the create and update methods do not take these
// properties.  This function strips the properties on input.
var stripHookIds = function(hook) {
    delete hook.hookId;
    delete hook.hookGroupId;
    return hook;
}

var HookDisplay = React.createClass({
  propTypes: {
    currentHookId:      React.PropTypes.string.isRequired,
    currentHookGroupId: React.PropTypes.string.isRequired,
    hook:               React.PropTypes.object.isRequired,
    startEditing:       React.PropTypes.func.isRequired,
  },

  render: function() {
    let hook = this.props.hook;
    return <div>
      <dl className="dl-horizontal">
        <dt>HookGroupId</dt>
        <dd><code>{this.props.currentHookGroupId}</code></dd>
        <dt>HookId</dt>
        <dd><code>{this.props.currentHookId}</code></dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Name</dt>
        <dd>{hook.metadata.name}</dd>
        <dt>Description</dt>
        <dd><format.Markdown>{hook.metadata.description}</format.Markdown></dd>
        <dt>Owner</dt>
        <dd>{hook.metadata.owner}</dd>
        <dt>Email On Error?</dt>
        <dd>{JSON.stringify(hook.metadata.emailOnError)}</dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Schedule</dt>
        <dd>
          { (hook.schedule.length > 0) ?
            <ul className="hookSchedule">
              {hook.schedule.map((s, i) => { return <li key={i}>{s}</li>; })}
            </ul>
          :
            <span>(no schedule)</span>
          }
        </dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Task Expires</dt>
        <dd>{hook.expires} after creation</dd>
        <dt>Task Deadline</dt>
        <dd>{hook.deadline} after creation</dd>
        <dt>Task Definition</dt>
      </dl>
      <format.Code language="json">
          {JSON.stringify(hook.task, undefined, 2)}
      </format.Code>
      <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
          onClick={this.props.startEditing}>
          <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Hook
        </bs.Button>
      </bs.ButtonToolbar>
    </div>
  }
});

var HookEditor = React.createClass({
  propTypes: {
    currentHookId:      React.PropTypes.string,
    currentHookGroupId: React.PropTypes.string,
    hook:               React.PropTypes.object,
    isCreating:         React.PropTypes.bool,
    createHook:         React.PropTypes.func.isRequired,
    updateHook:         React.PropTypes.func.isRequired,
    deleteHook:         React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    var hook;
    if (this.props.isCreating) {
      hook = initialHook
      // TODO: this stuff shouldn't be necessary, but the schema requires it
      var deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 60);
      hook.task.deadline = deadline.toJSON();
      hook.task.created = new Date().toJSON();
    } else {
      hook = this.props.hook;
    }
    let definition = JSON.stringify(hook, null, "\t");
    return {
      hookGroupId:      this.props.currentHookGroupId,
      hookId:           this.props.currentHookId,
      definition:       definition,
      invalidHook:      false
    };
  },

  render: function() {
    var isCreating = this.props.isCreating;

    return <div className="form-horizontal">
      <div className="form-group">
        <label className="control-label col-md-2">hookGroupId</label>
        <div className="col-md-10">
          {
            isCreating ?
              <input type="text"
                className="form-control"
                onChange={this.onHookGroupIdChange}
                placeholder="hookGroupId"/>
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
                onChange={this.onHookIdChange}
                placeholder="hookId"/>
              :
                <div className="form-control-static">
                  {this.props.currentHookId}
                </div>
          }
        </div>
      </div>
      {this.renderEditor()}
      {this.renderButtonBar()}
    </div>
  },

  renderEditor() {
    return (
      <span>
      <CodeMirror
        ref="editor"
        lineNumbers={true}
        mode="application/json"
        textAreaClassName={'form-control'}
        value={this.state.definition}
        onChange={this.onHookChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="neat"/>
    </span>
    );
  },

  renderButtonBar() {
    if (this.props.isCreating) {
      return <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.createHook}
                   disabled={!this.validHook()}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Hook
        </bs.Button>
      </bs.ButtonToolbar>
    } else {
      return <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
                   onClick={this.updateHook}
                   disabled={!this.validHook()}>
          <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
        </bs.Button>
        <ConfirmAction
          buttonStyle='danger'
          glyph='trash'
          label="Delete Hook"
          action={this.props.deleteHook}
          success="Hook deleted">
          Are you sure you want to delete hook
          <code>{this.props.currentHookGroupId + '/' + this.props.currentHookId}</code>?
        </ConfirmAction>
      </bs.ButtonToolbar>
    }
  },

  validHook() {
    if (this.state.invalidHook) {
        return false;
    }

    if (!this.state.hookGroupId || !this.state.hookId) {
        return false;
    }

    // TODO: parse against schema and show errors
    try {
      JSON.parse(this.state.definition);
    }
    catch(err) {
      return false;
    }

    return true;
  },

  onHookGroupIdChange(e) {
    this.setState({hookGroupId: e.target.value});
  },

  onHookIdChange(e) {
    this.setState({hookId: e.target.value});
  },

  onHookChange(e) {
    this.setState({definition: e.target.value});
  },

  createHook() {
    // TODO: reflect these into state with onChange hooks
    let hookGroupId = this.state.hookGroupId,
        hookId = this.state.hookId,
        hook = JSON.parse(this.state.definition);
    this.props.createHook(hookGroupId, hookId, hook);
  },

  updateHook() {
    let hook = JSON.parse(this.state.definition);
    this.props.updateHook(hook);
  },
});

/** Create hook editor/viewer (same thing) */
var HookEditView = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      },
      reloadOnProps: ['currentHookId', 'currentHookGroupId']
    })
  ],

  propTypes: {
    currentHookId:      React.PropTypes.string,
    currentHookGroupId: React.PropTypes.string,
    refreshHookList:    React.PropTypes.func.isRequired,
    selectHook:         React.PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      // Currently loaded hook
      hookLoaded:        false,
      hookError:         undefined,
      hook:              null,
      editing:           true,
      error:             null,
    };
  },

  /** Load initial state */
  load() {
    // Create a new hook if we don't have the hookGroupId and hookId
    if (!this.props.currentHookId || !this.props.currentHookGroupId) {
      return {
        hook:       undefined,
        editing:    true,
        error:      null
      };
    } else {
      let hook = this.hooks.hook(this.props.currentHookGroupId,
                                 this.props.currentHookId).then(stripHookIds)
      return {
        hook:       hook,
        editing:    false,
        error:      null
      };
    }
  },

  render() {
    // React calls render before it's loaded the initial state, at which
    // point we can't do anything...
    if (this.state.editing === undefined) {
        return <span />
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
    var waitFor             = this.renderWaitFor("hook");
    if (waitFor) {
      return waitFor;
    }

    var isCreating          = (!this.props.currentHookId ||
                               !this.props.currentHookGroupId);

    if (this.state.editing) {
        return <HookEditor hook={this.state.hook}
                    currentHookId={this.props.currentHookId}
                    currentHookGroupId={this.props.currentHookGroupId}
                    isCreating={isCreating}
                    createHook={this.createHook}
                    updateHook={this.updateHook}
                    deleteHook={this.deleteHook} />
    } else {
        return <HookDisplay hook={this.state.hook}
                    currentHookId={this.props.currentHookId}
                    currentHookGroupId={this.props.currentHookGroupId}
                    startEditing={this.startEditing} />
    }
  },

  startEditing() {
    this.setState({editing: true});
  },

  createHook(hookGroupId, hookId, hook) {
    // add hookId and hookGroupId to the hook, since they are required
    // by the schema
    this.hooks.createHook(
      hookGroupId,
      hookId,
      hook
    ).then(function(hook) {
      this.props.selectHook(hook.hookGroupId, hook.hookId);
      this.props.refreshHookList();
    }.bind(this), function(err) {
      this.setState({
        error:   err
      });
    }.bind(this));
  },

  updateHook(hook) {
    this.hooks.updateHook(
      this.props.currentHookGroupId,
      this.props.currentHookId,
      hook
    ).then(function(hook) {
      this.setState({
        hook:    stripHookIds(hook),
        editing: false,
        error:   null
      });
    }.bind(this), function(err) {
      this.setState({
        error:   err
      });
    }.bind(this));
  },

  async deleteHook() {
    await this.hooks.removeHook(this.props.currentHookGroupId, this.props.currentHookId);
    this.props.selectHook(undefined, undefined);
    this.props.refreshHookList();
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      error:        null
    });
  }
});

module.exports = HookEditView;
