var React                   = require('react');
var bs                      = require('react-bootstrap');
var utils                   = require('../lib/utils');
var taskcluster             = require('taskcluster-client');
var CodeMirror              = require('react-code-mirror');
var debug                   = require('debug')('taskcreator');
var _                       = require('lodash');
var slugid                  = require('slugid');


// Load javascript mode for CodeMirror
require('codemirror/mode/javascript/javascript');
require('../lib/codemirror/json-lint');

/** Create a task-creator */
var TaskEditor = React.createClass({
  getDefaultProps: function () {
    return {
      localStorageKey:      undefined,
      initialTaskValue:     "{}"
    };
  },

  getInitialState: function () {
    // Get initial task value
    var task = this.props.initialTaskValue;
    this.props.task = task;
    if (this.props.localStorageKey) {
      if (localStorage.getItem(this.props.localStorageKey)) {
        task = localStorage.getItem(this.props.localStorageKey);
        // Check that'll parse
        try {
          JSON.parse(task);
        }
        catch (err) {
          task = this.props.initialTaskValue;
        }
      }
    }

    return _.defaults(this.parameterizeTask(task), {
      createdTaskIdLoaded:   false,
      createdTaskIdError:    undefined,
      createdTaskId:         null
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

  render() {
    // If loaded, then either redirect to task-inspector
    // we'll show errors later if there are errors
    return (
      <span>
        {
          this.state.createdTaskIdError ? (
            this.renderError(this.state.createdTaskIdError)
          ) : undefined
        }
        {
          this.state.createdTaskIdLoaded === null ? (
            this.renderSpinner()
          ) : (
            this.renderEditor()
          )
        }
      </span>
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
        onChange={this.handleTaskChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="ambiance"/>
      <br/>
      <bs.ButtonToolbar>
        <bs.Button bsStyle="danger" onClick={this.handleReset}>
          <bs.Glyphicon glyph="remove"/>&nbsp;
          Reset Editor
        </bs.Button>
      </bs.ButtonToolbar>
      </span>
    );
  },

  /** Update state when task is modified */
  handleTaskChange(e) {
    // Attempt to parse task input
    var invalidTask = false;
    try {
      JSON.parse(e.target.value);
    }
    catch (err) {
      invalidTask = true;
    }
    this.setState({
      task:           e.target.value,
      invalidTask:    invalidTask
    });
    this.props.task = this.state.task;
  },

  /** Reset to initialTaskValue */
  handleReset: function() {
    this.setState(this.parameterizeTask(this.props.initialTaskValue));
  }
});

// Export TaskEditor
module.exports = TaskEditor;
