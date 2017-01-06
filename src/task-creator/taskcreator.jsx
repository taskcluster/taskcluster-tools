import React from 'react';
import {Button, ButtonToolbar, Glyphicon, Row, Col} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import CodeMirror from 'react-code-mirror';
import createDebugger from 'debug';
import _ from 'lodash';
import slugid from 'slugid';
import jsonlint from 'durable-json-lint';
import 'codemirror/mode/javascript/javascript';
import '../lib/codemirror/json-lint';
import './taskcreator.less';

const debug = createDebugger('taskcreator');

/** Parse json with jsonlint and accept corrections, and throw on error */
const parseJSON = text => {
  const {json, errors} = jsonlint(text);

  if (errors.length > 0) {
    throw new Error(errors[0].description || errors[0].message);
  }

  return JSON.parse(json);
};

/** Create a task-creator */
export default React.createClass({
  displayName: 'TaskCreator',

  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
      },
    }),
  ],

  getDefaultProps() {
    return {
      localStorageKey: undefined,
      initialTaskValue: '{}',
    };
  },

  getInitialState() {
    // Get initial task value
    let task = this.props.initialTaskValue;

    if (this.props.localStorageKey) {
      if (localStorage.getItem(this.props.localStorageKey)) {
        task = localStorage.getItem(this.props.localStorageKey);

        // Check that'll parse
        try {
          parseJSON(task);
        } catch (err) {
          task = this.props.initialTaskValue;
        }
      }
    }

    return _.defaults(this.parameterizeTask(task), {
      createdTaskIdLoaded: false,
      createdTaskIdError: undefined,
      createdTaskId: null,
    });
  },

  /** Parameterize a task, return state after parameterization attempt */
  parameterizeTask(_task) {
    // Assume the is valid JSON
    let invalidTask = false;
    let task = _task;

    // Parameterize with new deadline and created time
    try {
      const data = parseJSON(task);
      const deadline = new Date();

      deadline.setMinutes(deadline.getMinutes() + 60);
      data.created = new Date().toJSON();
      data.deadline = deadline.toJSON();
      task = JSON.stringify(data, null, '\t') + '\n';
    } catch (err) {
      debug('Failed to parameterize task, err: %s, %j', err, err, err.stack);
      invalidTask = true;
    }

    // Set task, and serialize to string after parameterization
    return {
      task,
      invalidTask,
    };
  },

  render() {
    // If loaded, then either redirect to task-inspector
    // we'll show errors later if there are errors
    if (this.state.createdTaskIdLoaded) {
      if (!this.state.createdTaskIdError && this.state.createdTaskId) {
        const link = `/task-inspector/#${this.state.createdTaskId}/`;

        window.location = link;

        return (
          <Row style={{marginBottom: 40}}>
            <Col sm={12}>
              <a href={link}>
                See&nbsp;
                <code>{this.state.createdTaskId}</code>
                &nbsp;in task inspector.
              </a>
            </Col>
          </Row>
        );
      }
    }

    return (
      <Col sm={12}>
        <h4>Task Creator</h4>
        <p>
          Write and submit a task to TaskCluster. For details on what you can
          write refer to the&nbsp;
          <a href="https://docs.taskcluster.net">documentation</a>.
          When you submit a task here, you will be taken to the inspector, and the
          task will be stored in <code>localStorage</code>, so you can always
          come back and easily try a new variation.
        </p>
        <hr />
        {this.state.createdTaskIdError ? this.renderError(this.state.createdTaskIdError) : null}
        {this.state.createdTaskIdLoaded === null ? this.renderSpinner() : this.renderEditor()}
      </Col>
    );
  },

  /** Render task editor */
  renderEditor() {
    return (
      <div>
        <CodeMirror
          ref="editor"
          lineNumbers={true}
          mode="application/json"
          textAreaClassName="form-control"
          textAreaStyle={{minHeight: '20em'}}
          value={this.state.task}
          onChange={this.handleTaskChange}
          indentWithTabs={true}
          tabSize={2}
          lint={true}
          gutters={['CodeMirror-lint-markers']}
          theme="ambiance" />
        <br />
        <ButtonToolbar>
          <Button bsStyle="primary" onClick={this.handleCreateTask} disabled={this.state.invalidTask}>
            <Glyphicon glyph="ok" /> Create Task
          </Button>
          <Button bsStyle="info" onClick={this.handleUpdateTimestamps} disabled={this.state.invalidTask}>
            <Glyphicon glyph="repeat" /> Update Timestamps
          </Button>
          <Button bsStyle="danger" onClick={this.handleReset}>
            <Glyphicon glyph="remove" /> Reset Editor
          </Button>
        </ButtonToolbar>
      </div>
    );
  },

  /** Update state when task is modified */
  handleTaskChange(e) {
    // Attempt to parse task input
    let invalidTask = false;

    try {
      parseJSON(e.target.value);
    } catch (err) {
      invalidTask = true;
    }

    this.setState({
      invalidTask,
      task: e.target.value,
    });
  },

  /** Create task and redirect */
  handleCreateTask() {
    // Create task and get taskId of created task
    const taskCreated = Promise
      .resolve(this.state.task)
      .then(task => {
        const taskId = slugid.nice();
        const payload = parseJSON(task);

        return this.queue
          .createTask(taskId, payload)
          .then(() => {
            // Save task definition to localStorage
            if (this.props.localStorageKey) {
              localStorage.setItem(this.props.localStorageKey, task);
            }

            return taskId;
          });
      });

    // Load state from promise (see TaskClusterMixin)
    this.loadState({
      createdTaskId: taskCreated,
    });
  },

  /** Reset timestamps in the task **/
  handleUpdateTimestamps() {
    // Create task and get taskId of created task
    // Load state from promise (see TaskClusterMixin)
    Promise
      .resolve(this.state.task)
      .then(task => {
        this.setState(this.parameterizeTask(task));
      });
  },

  /** Reset to initialTaskValue */
  handleReset() {
    this.setState(this.parameterizeTask(this.props.initialTaskValue));
  },
});
