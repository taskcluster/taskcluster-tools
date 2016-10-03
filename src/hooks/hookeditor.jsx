import React from 'react';
import { findDOMNode } from 'react-dom';
import _ from 'lodash';
import { Button, Glyphicon, ButtonToolbar, Alert } from 'react-bootstrap';
import ConfirmAction from '../lib/ui/confirmaction';
import CodeMirror from 'react-code-mirror';
import * as format from '../lib/format';
import taskcluster from 'taskcluster-client';
import * as utils from '../lib/utils';
// Load javascript mode for CodeMirror
import 'codemirror/mode/javascript/javascript';
import '../lib/codemirror/json-lint';
import './hookeditor.less';

const initialHook = {
  metadata: {
    name: '',
    description: '',
    owner: '',
    emailOnError: true
  },
  schedule: [],
  expires: '3 months',
  deadline: '6 hours',
  task: {
    provisionerId: 'aws-provisioner-v1',
    workerType: 'tutorial',
    payload: {
      image: 'ubuntu:14.04',
      command: ['/bin/bash', '-c', 'echo "hello World"'],
      maxRunTime: 60 * 10
    },
    metadata: {
      name: 'Hook Task',
      description: 'Task Description',
      owner: 'name@example.com',
      source: 'https://tools.taskcluster.net/hooks/'
    }
  }
};

// some of the API functions return hook descriptions containing hookId
// and hookGroupId, but the create and update methods do not take these
// properties.  This function strips the properties on input.
const stripHookIds = hook => {
  const strippedHook = { ...hook };

  delete strippedHook.hookId;
  delete strippedHook.hookGroupId;

  return strippedHook;
};

const HookStatusDisplay = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks: taskcluster.Hooks
      },
      reloadOnProps: ['currentHookId', 'currentHookGroupId']
    })
  ],

  propTypes: {
    currentHookId: React.PropTypes.string.isRequired,
    currentHookGroupId: React.PropTypes.string.isRequired
  },

  getInitialState() {
    return {
      hookStatus: null
    };
  },

  /** Load initial state */
  load() {
    return {
      hookStatus: this.hooks
        .getHookStatus(this.props.currentHookGroupId, this.props.currentHookId)
    };
  },

  render() {
    const waitFor = this.renderWaitFor('hookStatus');

    if (waitFor) {
      return waitFor;
    }

    const stat = this.state.hookStatus;
    let lastTime;
    let lastResult;

    if (stat.lastFire.result === 'no-fire') {
      lastTime = <span className="text-muted">Never Fired</span>;
      lastResult = <span className="text-muted">None</span>;
    } else {
      lastTime = <format.DateView date={stat.lastFire.time}/>;

      if (stat.lastFire.result === 'error') {
        lastResult = <pre>{JSON.stringify(stat.lastFire.error, null, 2)}</pre>;
      } else {
        const taskId = stat.lastFire.taskId;
        const href = `/task-inspector/#${taskId}`;

        lastResult = <span>Created task <a href={href}>{taskId}</a></span>;
      }
    }

    const when = stat.nextScheduledDate ?
      <format.DateView date={stat.nextScheduledDate} /> :
      <span className="text-muted">Not Scheduled</span>;

    return (
      <dl className="dl-horizontal">
        <dt>Last Fired</dt>
        <dd>
          {lastTime}
          <Button className="btn-xs" onClick={this.reload}>
            <Glyphicon glyph="refresh" />
          </Button>
        </dd>
        <dt>Last Fire Result</dt>
        <dd>{lastResult}</dd>
        <dt>Next Scheduled Fire</dt>
        <dd>{when}</dd>
      </dl>
    );
  }
});

const HookDisplay = React.createClass({
  propTypes: {
    currentHookId: React.PropTypes.string.isRequired,
    currentHookGroupId: React.PropTypes.string.isRequired,
    hook: React.PropTypes.object.isRequired,
    startEditing: React.PropTypes.func.isRequired
  },

  render() {
    const hook = this.props.hook;

    return (
      <div>
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
            {
              hook.schedule.length ? (
                <ul className="hookSchedule">
                  {hook.schedule.map((schedule, key) => <li key={key}>{schedule}</li>)}
                </ul>
              ) :
              <span>(no schedule)</span>
            }
          </dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Task Expires</dt>
          <dd>{hook.expires} after creation</dd>
          <dt>Task Deadline</dt>
          <dd>{hook.deadline} after creation</dd>
        </dl>
        <HookStatusDisplay
          currentHookGroupId={this.props.currentHookGroupId}
          currentHookId={this.props.currentHookId} />
        <dl className="dl-horizontal">
          <dt>Task Definition</dt>
          <dd />
        </dl>
        <format.Code language="json">
          {JSON.stringify(hook.task, null, 2)}
        </format.Code>
        <ButtonToolbar>
          <Button bsStyle="success" onClick={this.props.startEditing}>
            <Glyphicon glyph="pencil" /> Edit Hook
          </Button>
          <Button bsStyle="success" onClick={this.props.triggerHook}>
            <Glyphicon glyph="repeat" /> Trigger Hook
          </Button>
        </ButtonToolbar>
      </div>
    );
  }
});

const HookEditor = React.createClass({
  propTypes: {
    currentHookId: React.PropTypes.string,
    currentHookGroupId: React.PropTypes.string,
    hook: React.PropTypes.object,
    isCreating: React.PropTypes.bool,
    createHook: React.PropTypes.func.isRequired,
    updateHook: React.PropTypes.func.isRequired,
    deleteHook: React.PropTypes.func.isRequired
  },

  getInitialState() {
    const hook = this.props.isCreating ?
      initialHook :
      this.props.hook;

    return {
      hookGroupId: this.props.currentHookGroupId,
      hookId: this.props.currentHookId,
      name: hook.metadata.name,
      description: hook.metadata.description,
      owner: hook.metadata.owner,
      emailOnError: hook.metadata.emailOnError,
      schedule: _.cloneDeep(hook.schedule),
      expires: hook.expires,
      deadline: hook.deadline,
      task: JSON.stringify(hook.task, null, 2)
    };
  },

  render() {
    const isCreating = this.props.isCreating;

    try {
      return (
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-2">HookGroupId</label>
            <div className="col-md-10">
              {
                isCreating ? (
                  <input type="text"
                    className="form-control"
                    onChange={this.onHookGroupIdChange}
                    placeholder="hookGroupId" />
                  ) :
                  <div className="form-control-static">{this.props.currentHookGroupId}</div>
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">HookId</label>
            <div className="col-md-10">
              {
                isCreating ? (
                  <input type="text"
                    className="form-control"
                    onChange={this.onHookIdChange}
                    placeholder="hookId" />
                  ) :
                  <div className="form-control-static">{this.props.currentHookId}</div>
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Name</label>
            <div className="col-md-10">
               <input type="text"
                 className="form-control"
                 defaultValue={this.state.name}
                 onChange={this.onNameChange}
                 placeholder="Hook Name" />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Description</label>
            <div className="col-md-10">
               <textarea className="form-control"
                 defaultValue={this.state.description}
                 onChange={this.onDescriptionChange}
                 rows={8}
                 placeholder="Hook Description (markdown)" />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Owner</label>
            <div className="col-md-10">
               <input type="text"
                 className="form-control"
                 defaultValue={this.state.owner}
                 onChange={this.onOwnerChange}
                 placeholder="Owner email" />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">EmailOnError</label>
            <div className="col-md-10">
              <input type="checkbox"
                 checked={this.state.emailOnError}
                 onChange={this.onEmailOnErrorChange} />
              <span className="text-info">
                Email the owner when an error occurs while creating a task.
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Schedule</label>
            <div className="col-md-10">
               <p className="text-info">
                 See <a target="_blank" href="https://www.npmjs.com/package/cron-parser">cron-parser</a> for format
                 information. Times are in UTC.
               </p>
               <ul style={{ paddingLeft: 20 }}>
                 {
                   this.state.schedule.map((sched, index) => (
                     <li key={index}>
                       <code>{sched}</code>
                       &nbsp;
                       <Button
                         bsStyle="danger"
                         bsSize="xsmall"
                         onClick={this.removeScheduleItem.bind(this, index)}>
                          <Glyphicon glyph="trash"/>
                       </Button>
                     </li>
                   ))
                 }
               </ul>
               <div className="input-group">
                 <input
                   type="text"
                   className="form-control"
                   placeholder="* * * * * *"
                   ref="newSch" />
                 <span className="input-group-btn">
                   <button
                     className="btn btn-success"
                     type="button" onClick={this.onNewScheduleItem}>
                      <Glyphicon glyph="plus" /> Add
                   </button>
                 </span>
               </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Expires</label>
            <div className="col-md-10">
               <input type="text"
                 className="form-control"
                 defaultValue={this.state.expires}
                 onChange={this.onExpiresChange}
                 placeholder="Task expiration (relative)" />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Deadline</label>
            <div className="col-md-10">
               <input type="text"
                 className="form-control"
                 defaultValue={this.state.deadline}
                 onChange={this.onDeadlineChange}
                 placeholder="Task deadline (relative)" />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Task</label>
            <div className="col-md-10">
              <CodeMirror
                ref="editor"
                lineNumbers={true}
                mode="application/json"
                textAreaClassName="form-control"
                value={this.state.task}
                onChange={this.onTaskChange}
                indentWithTabs={true}
                tabSize={2}
                lint={true}
                gutters={['CodeMirror-lint-markers']}
                theme="neat" />
            </div>
          </div>
          {this.renderButtonBar()}
        </div>
      );
    } catch (e) {
      console.log(e);
    }
  },

  renderButtonBar() {
    if (this.props.isCreating) {
      return (
        <ButtonToolbar>
          <Button bsStyle="primary" onClick={this.createHook} disabled={!this.validHook()}>
            <Glyphicon glyph="plus"/> Create Hook
          </Button>
        </ButtonToolbar>
      );
    }

    return (
      <ButtonToolbar>
        <Button bsStyle="success" onClick={this.updateHook} disabled={!this.validHook()}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ConfirmAction
          buttonStyle="danger"
          glyph="trash"
          label="Delete Hook"
          action={this.props.deleteHook}
          success="Hook deleted">
            Are you sure you want to delete hook
            &nbsp;<code>{`${this.props.currentHookGroupId}/${this.props.currentHookId}`}</code>?
        </ConfirmAction>
      </ButtonToolbar>
    );
  },

  validHook() {
    const isValid = ['hookGroupId', 'hookId', 'name', 'description', 'owner', 'deadline']
      .every(s => this.state[s]);

    if (!isValid) {
      return false;
    }

    // TODO: parse against schema and show errors
    try {
      JSON.parse(this.state.task);
      return true;
    } catch (err) {
      return false;
    }
  },

  onHookGroupIdChange(e) {
    this.setState({ hookGroupId: e.target.value });
  },

  onHookIdChange(e) {
    this.setState({ hookId: e.target.value });
  },

  onNameChange(e) {
    this.setState({ name: e.target.value });
  },

  onDescriptionChange(e) {
    this.setState({ description: e.target.value });
  },

  onOwnerChange(e) {
    this.setState({ owner: e.target.value });
  },

  onEmailOnErrorChange() {
    this.setState({ emailOnError: !this.state.emailOnError });
  },

  removeScheduleItem(index) {
    const schedule = _
      .cloneDeep(this.state.schedule)
      .splice(index, 1);

    this.setState({ schedule });
  },

  onNewScheduleItem() {
    const sch = findDOMNode(this.refs.newSch).value;

    if (sch !== '') {
      const schedule = _.cloneDeep(this.state.schedule);

      schedule.push(sch);
      this.setState({ schedule });
    }

    findDOMNode(this.refs.newSch).value = '';
  },

  onScheduleTextChange(e) {
    this.setState({ scheduleText: e.target.value });
  },

  onExpiresChange(e) {
    this.setState({ expires: e.target.value });
  },

  onDeadlineChange(e) {
    this.setState({ deadline: e.target.value });
  },

  onTaskChange(e) {
    this.setState({ task: e.target.value });
  },

  getHookDefinition() {
    return {
      metadata: {
        name: this.state.name,
        description: this.state.description,
        owner: this.state.owner,
        emailOnError: this.state.emailOnError
      },
      schedule: this.state.schedule,
      expires: this.state.expires,
      deadline: this.state.deadline,
      task: JSON.parse(this.state.task)
    };
  },

  createHook() {
    // TODO: reflect these into state with onChange hooks
    this.props.createHook(this.state.hookGroupId, this.state.hookId, this.getHookDefinition());
  },

  updateHook() {
    this.props.updateHook(this.getHookDefinition());
  }
});

/** Create hook editor/viewer (same thing) */
const HookEditView = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks: taskcluster.Hooks
      },
      reloadOnProps: ['currentHookId', 'currentHookGroupId']
    })
  ],

  propTypes: {
    currentHookId: React.PropTypes.string,
    currentHookGroupId: React.PropTypes.string,
    refreshHookList: React.PropTypes.func.isRequired,
    selectHook: React.PropTypes.func.isRequired,
    triggerHook: React.PropTypes.func
  },

  getInitialState() {
    return {
      // Currently loaded hook
      hookLoaded: false,
      hookError: null,
      hook: null,
      editing: true,
      error: null
    };
  },

  /** Load initial state */
  load() {
    // Create a new hook if we don't have the hookGroupId and hookId
    if (!this.props.currentHookId || !this.props.currentHookGroupId) {
      return {
        hook: null,
        editing: true,
        error: null
      };
    }

    const hook = this.hooks
      .hook(this.props.currentHookGroupId, this.props.currentHookId)
      .then(stripHookIds);

    return {
      hook,
      editing: false,
      error: null
    };
  },

  render() {
    // React calls render before it's loaded the initial state, at which
    // point we can't do anything...
    if (this.state.editing == null) {
      return <span />;
    }

    // display errors from operations
    if (this.state.error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          <br />
          {this.state.error.toString()}
        </Alert>
      );
    }

    const waitFor = this.renderWaitFor('hook');

    if (waitFor) {
      return waitFor;
    }

    const isCreating = !this.props.currentHookId || !this.props.currentHookGroupId;

    if (this.state.editing) {
      return (
        <HookEditor
          hook={this.state.hook}
          currentHookId={this.props.currentHookId}
          currentHookGroupId={this.props.currentHookGroupId}
          isCreating={isCreating}
          createHook={this.createHook}
          updateHook={this.updateHook}
          deleteHook={this.deleteHook} />
      );
    }

    return (
      <HookDisplay
        hook={this.state.hook}
        currentHookId={this.props.currentHookId}
        currentHookGroupId={this.props.currentHookGroupId}
        startEditing={this.startEditing}
        triggerHook={this.triggerHook} />
    );
  },

  startEditing() {
    this.setState({ editing: true });
  },

  triggerHook() {
    // Payloads are ignored, so we send empty data over
    this.hooks
      .triggerHook(this.props.currentHookGroupId, this.props.currentHookId, {})
      .catch(error => this.setState({ error }));
  },

  createHook(hookGroupId, hookId, hook) {
    // add hookId and hookGroupId to the hook, since they are required
    // by the schema
    this.hooks
      .createHook(hookGroupId, hookId, hook)
      .then(hook => {
        this.props.selectHook(hook.hookGroupId, hook.hookId);
        this.props.refreshHookList();
      })
      .catch(err => {
        this.setState({ error: err });
      });
  },

  async updateHook(hook) {
    try {
      await this.hooks.updateHook(this.props.currentHookGroupId, this.props.currentHookId, hook);

      this.setState({
        hook: stripHookIds(hook),
        editing: false,
        error: null
      });
    } catch (err) {
      this.setState({ error: err });
    }
  },

  async deleteHook() {
    await this.hooks.removeHook(this.props.currentHookGroupId, this.props.currentHookId);
    this.props.selectHook();
    this.props.refreshHookList();
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      error: null
    });
  }
});

export default HookEditView;
