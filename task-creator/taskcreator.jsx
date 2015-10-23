var React                   = require('react');
var bs                      = require('react-bootstrap');
var utils                   = require('../lib/utils');
var taskcluster             = require('taskcluster-client');
var CodeMirror              = require('react-code-mirror');
var debug                   = require('debug')('taskcreator');
var _                       = require('lodash');
var slugid                  = require('slugid');
var jsonlint                = require('durable-json-lint');

// Load javascript mode for CodeMirror
require('codemirror/mode/javascript/javascript');
require('../lib/codemirror/json-lint');

/** Parse json with jsonlint and accept corrections, and throw on error */
let parseJSON = (text) => {
  let {json, errors} = jsonlint(text);
  if (errors.length > 0) {
    throw new Error(errors[0].description || errors[0].message);
  }
  return JSON.parse(json);
};

/** Create a task-creator */
var TaskCreator = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue:        taskcluster.Queue
      }
    })
  ],

  getDefaultProps() {
    return {
      localStorageKey:      undefined,
      initialTaskValue:     "{}"
    };
  },

  getInitialState() {
    // Get initial task value
    var task = this.props.initialTaskValue;
    if (this.props.localStorageKey) {
      if (localStorage.getItem(this.props.localStorageKey)) {
        task = localStorage.getItem(this.props.localStorageKey);
        // Check that'll parse
        try {
          parseJSON(task);
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
      var data      = parseJSON(task);
      var deadline  = new Date();
      deadline.setMinutes(deadline.getMinutes() + 60);
      data.created  = new Date().toJSON();
      data.deadline = deadline.toJSON();
      task          = JSON.stringify(data, null, '\t');
    }
    catch (err) {
      debug("Failed to parameterize task, err: %s, %j",
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
    if (this.state.createdTaskIdLoaded) {
      if (!this.state.createdTaskIdError && this.state.createdTaskId) {
        var link = '/task-inspector/#' + this.state.createdTaskId + '/';
        window.location = link;
        return (
          <bs.Col md={10} mdOffset={1}>
            <a href={link}>
              See&nbsp;
              <code>{this.state.createdTaskId}</code>
              &nbsp;in task inspector.
            </a>
          </bs.Col>
        );
      }
    }

    return (
      <bs.Col md={10} mdOffset={1}>
        <h1>Task Creator</h1>
        <hr/>
        <p>
          Write and submit a task to TaskCluster. For details on what you can
          write refer to the&nbsp;
          <a href="http://docs.taskcluster.net">documentation</a>.
          When you submit a task here, you will be taken to the inspector, and the
          task will be stored in <code>localStorage</code>, so you can always
          come back and easily try a new variation.
        </p>
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
      </bs.Col>
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
        textAreaStyle={{minHeight: '20em'}}
        value={this.state.task}
        onChange={this.handleTaskChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={["CodeMirror-lint-markers"]}
        theme="ambiance"/>
      <br/>
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.handleCreateTask}
                   disabled={this.state.invalidTask}>
          <bs.Glyphicon glyph="ok"/>&nbsp;
          Create Task
        </bs.Button>
        <bs.Button bsStyle="info"
                   onClick={this.handleUpdateTimestamps}
                   disabled={this.state.invalidTask}>
          <bs.Glyphicon glyph="repeat"/>&nbsp;
          Update Timestamps
        </bs.Button>
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
      parseJSON(e.target.value);
    }
    catch (err) {
      invalidTask = true;
    }
    this.setState({
      task:           e.target.value,
      invalidTask:    invalidTask
    });
  },

  /** Create task and redirect */
  handleCreateTask() {
    // Create task and get taskId of created task
    var taskCreated = Promise.resolve(this.state.task).then(function(task) {
      var taskId  = slugid.nice();
      var payload = parseJSON(task);
      return this.queue.createTask(taskId, payload).then(function() {
        // Save task definition to localStorage
        if (this.props.localStorageKey) {
          localStorage.setItem(this.props.localStorageKey, task);
        }
        return taskId;
      }.bind(this));
    }.bind(this));

    // Load state from promise (see TaskClusterMixin)
    this.loadState({
      createdTaskId:        taskCreated
    });
  },

  /** Reset timestamps in the task **/
  handleUpdateTimestamps() {
    // Create task and get taskId of created task
    // Load state from promise (see TaskClusterMixin)
    Promise.resolve(this.state.task).then(function(task) {
        this.setState(this.parameterizeTask(task));
    }.bind(this));
  },
  /** Reset to initialTaskValue */
  handleReset: function() {
    this.setState(this.parameterizeTask(this.props.initialTaskValue));
  }
});

// Export TaskCreator
module.exports = TaskCreator;
