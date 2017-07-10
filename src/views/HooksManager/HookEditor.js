import React from 'react';
import { string, bool, object, func } from 'prop-types';
import { Button, Glyphicon, ButtonToolbar } from 'react-bootstrap';
import clone from 'lodash.clonedeep';
import equal from 'deep-equal';
import { assocPath } from 'ramda';
import Icon from 'react-fontawesome';
import ModalItem from '../../components/ModalItem';
import CodeEditor from '../../components/CodeEditor';
// import ConfirmAction from '../lib/ui/confirmaction';

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
      source: 'https://tools.taskcluster.net/hooks'
    }
  }
};

export default class HookEditor extends React.PureComponent {
  static propTypes = {
    currentHookId: string,
    currentHookGroupId: string,
    hook: object,
    isCreating: bool,
    createHook: func.isRequired,
    updateHook: func.isRequired,
    deleteHook: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      newScheduleValue: '',
      hook: null
    };
  }

  componentWillMount() {
    this.setState({
      hook: clone(this.props.isCreating ? initialHook : this.props.hook)
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.hookGroupId !== this.props.hookGroupId ||
      nextProps.hookId !== this.props.hookId ||
      !equal(nextProps.hook, this.props.hook)
    ) {
      this.setState({
        hook: clone(this.props.isCreating ? initialHook : this.props.hook)
      });
    }
  }

  handleNewScheduleChange = e => this.setState({ newScheduleValue: e.target.value });

  validHook = () => {
    const { hook } = this.state;
    const isValid = (
      hook.metadata.name &&
      hook.metadata.description &&
      hook.metadata.owner &&
      hook.deadline
    );

    if (!isValid) {
      return false;
    }

    // TODO: parse against schema and show errors
    try {
      JSON.parse(JSON.stringify(hook.task));
      return true;
    } catch (err) {
      return false;
    }
  };

  onHookGroupIdChange = e => this.setState({
    hook: assocPath(['hookGroupId'], e.target.value, this.state.hook)
  });

  onHookIdChange = e => this.setState({
    hook: assocPath(['hookId'], e.target.value, this.state.hook)
  });

  onNameChange = e => this.setState({
    hook: assocPath(['metadata', 'name'], e.target.value, this.state.hook)
  });

  onDescriptionChange = e => this.setState({
    hook: assocPath(['metadata', 'description'], e.target.value, this.state.hook)
  });

  onOwnerChange = e => this.setState({
    hook: assocPath(['metadata', 'owner'], e.target.value, this.state.hook)
  });

  onEmailOnErrorChange = () => this.setState({
    hook: assocPath(['metadata', 'emailOnError'], !this.state.hook.metadata.emailOnError, this.state.hook)
  });

  removeScheduleItem = (index) => {
    const schedule = [...this.state.hook.schedule];

    schedule.splice(index, 1);

    this.setState({ hook: { ...this.state.hook, schedule } });
  };

  onNewScheduleItem = () => {
    const { newScheduleValue } = this.state;

    if (newScheduleValue) {
      this.setState({
        newScheduleValue: '',
        hook: assocPath(['schedule'], [...clone(this.state.hook.schedule), newScheduleValue], this.state.hook)
      });
    }
  };

  onScheduleTextChange = e => this.setState({
    hook: assocPath(['scheduleText'], e.target.value, this.state.hook)
  });

  onExpiresChange = e => this.setState({
    hook: assocPath(['expires'], e.target.value, this.state.hook)
  });

  onDeadlineChange = e => this.setState({
    hook: assocPath(['deadline'], e.target.value, this.state.hook)
  });

  onTaskChange = value => this.setState({
    hook: assocPath(['task'], JSON.parse(value), this.state.hook)
  });

  getHookDefinition = () => {
    const { hook } = this.state;

    return {
      metadata: {
        name: hook.metadata.name,
        description: hook.metadata.description,
        owner: hook.metadata.owner,
        emailOnError: hook.metadata.emailOnError
      },
      schedule: hook.schedule,
      expires: hook.expires,
      deadline: hook.deadline,
      task: hook.task
    };
  };

  // TODO: reflect these into state with onChange hooks
  createHook = () => {
    const { hook } = this.state;

    this.props.createHook(hook.hookGroupId, hook.hookId, this.getHookDefinition());
  };

  updateHook = () => this.props.updateHook(this.getHookDefinition());

  renderButtonBar() {
    const { isCreating, hookGroupId, hookId } = this.props;

    if (isCreating) {
      return (
        <ButtonToolbar style={{ float: 'right' }}>
          <Button bsStyle="primary" onClick={this.createHook} disabled={!this.validHook()}>
            <Glyphicon glyph="plus" /> Create Hook
          </Button>
        </ButtonToolbar>
      );
    }

    return (
      <ButtonToolbar style={{ float: 'right' }}>
        <Button bsStyle="success" onClick={this.updateHook} disabled={!this.validHook()}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ModalItem
          button={true}
          bsStyle="danger"
          onSubmit={this.props.deleteHook}
          body={<span>Are you sure you want to delete hook <code>{hookGroupId}/{hookId}</code>?</span>}>
          <Icon name="trash" /> Delete Hook
        </ModalItem>
      </ButtonToolbar>
    );
  }

  render() {
    const { isCreating, hookGroupId, hookId } = this.props;
    const { hook } = this.state;

    if (!hook) {
      return null;
    }

    return (
      <div className="form-horizontal">
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="control-label col-md-2">HookGroupId</label>
          <div className="col-md-10">
            {
              isCreating ?
                (
                  <input
                    type="text"
                    className="form-control"
                    value={hook.hookGroupId}
                    onChange={this.onHookGroupIdChange}
                    placeholder="hookGroupId" />
                ) :
                (
                  <div className="form-control-static">
                    {hookGroupId}
                  </div>
                )
            }
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">HookId</label>
          <div className="col-md-10">
            {
              isCreating ? (
                <input
                  type="text"
                  className="form-control"
                  value={hook.hookId}
                  onChange={this.onHookIdChange}
                  placeholder="hookId" />
              ) : (
                <div className="form-control-static">
                  {hookId}
                </div>
              )
            }
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Name</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.metadata.name}
              onChange={this.onNameChange}
              placeholder="Hook Name" />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Description</label>
          <div className="col-md-10">
            <textarea
              className="form-control"
              defaultValue={hook.metadata.description}
              onChange={this.onDescriptionChange}
              rows={8}
              placeholder="Hook Description (markdown)" />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Owner</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.metadata.owner}
              onChange={this.onOwnerChange}
              placeholder="Owner email" />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">EmailOnError</label>
          <div className="col-md-10">
            <input
              type="checkbox"
              checked={hook.metadata.emailOnError}
              onChange={this.onEmailOnErrorChange} />&nbsp;
            <span className="text-info">
              Email the owner when an error occurs while creating a task.
              Note: to be notified of tasks that fail once created,
              use <a href="https://docs.taskcluster.net/reference/core/taskcluster-notify" target="_blank" rel="noopener noreferrer">notify routes</a>.
            </span>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Schedule</label>
          <div className="col-md-10">
            <p className="text-info">
              See <a href="https://www.npmjs.com/package/cron-parser" target="_blank" rel="noopener noreferrer">
              cron-parser</a> for format information. Times are in UTC.
            </p>
            <ul style={{ paddingLeft: 20 }}>
              {hook.schedule.map((schedule, index) => (
                <li key={`hook-schedule-${index}`}>
                  <code>{schedule}</code>
                  <Button
                    bsStyle="danger"
                    bsSize="xsmall"
                    onClick={() => this.removeScheduleItem(index)}>
                    <Glyphicon glyph="trash" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="* * * * * *"
                value={this.state.newScheduleValue}
                onChange={this.handleNewScheduleChange} />
              <span className="input-group-btn">
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={this.onNewScheduleItem}>
                  <Glyphicon glyph="plus" /> Add
                </button>
              </span>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Expires</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.expires}
              onChange={this.onExpiresChange}
              placeholder="Task expiration (relative)" />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Deadline</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.deadline}
              onChange={this.onDeadlineChange}
              placeholder="Task deadline (relative)" />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Task</label>
          <div className="col-md-10">
            <CodeEditor mode="json" value={JSON.stringify(hook.task, null, 2)} onChange={this.onTaskChange} />
          </div>
        </div>
        {this.renderButtonBar()}
      </div>
    );
  }
}
