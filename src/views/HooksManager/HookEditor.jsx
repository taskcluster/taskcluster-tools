import { PureComponent } from 'react';
import { string, bool, object, func } from 'prop-types';
import { Alert, Button, Glyphicon, ButtonToolbar } from 'react-bootstrap';
import clone from 'lodash.clonedeep';
import equal from 'deep-equal';
import { assocPath } from 'ramda';
import Icon from 'react-fontawesome';
import ModalItem from '../../components/ModalItem';
import CodeEditor from '../../components/CodeEditor';

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
  },
  triggerSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

export default class HookEditor extends PureComponent {
  static propTypes = {
    currentHookId: string,
    currentHookGroupId: string,
    hook: object,
    error: object,
    isCreating: bool,
    onCreateHook: func.isRequired,
    onUpdateHook: func.isRequired,
    onDeleteHook: func.isRequired,
    onError: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      newScheduleValue: '',
      hook: null,
      hookValidJson: false,
      triggerSchemaValidJson: false
    };
  }

  componentWillMount() {
    this.setState({
      hook: clone(this.props.isCreating ? initialHook : this.props.hook),
      hookValidJson: true,
      triggerSchemaValidJson: true
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.hookGroupId !== this.props.hookGroupId ||
      nextProps.hookId !== this.props.hookId ||
      !equal(nextProps.hook, this.props.hook)
    ) {
      this.setState({
        hook: clone(this.props.isCreating ? initialHook : this.props.hook),
        hookValidJson: true,
        triggerSchemaValidJson: true
      });
    }
  }

  handleNewScheduleChange = e =>
    this.setState({ newScheduleValue: e.target.value });

  validHook = () => {
    const { hook } = this.state;

    return (
      hook.metadata.name &&
      hook.metadata.description &&
      hook.metadata.owner &&
      hook.deadline &&
      this.state.hookValidJson &&
      this.state.triggerSchemaValidJson
    );
  };

  handleHookGroupIdChange = e =>
    this.setState({
      hook: assocPath(['hookGroupId'], e.target.value, this.state.hook)
    });

  handleHookIdChange = e =>
    this.setState({
      hook: assocPath(['hookId'], e.target.value, this.state.hook)
    });

  handleNameChange = e =>
    this.setState({
      hook: assocPath(['metadata', 'name'], e.target.value, this.state.hook)
    });

  handleDescriptionChange = e =>
    this.setState({
      hook: assocPath(
        ['metadata', 'description'],
        e.target.value,
        this.state.hook
      )
    });

  handleOwnerChange = e =>
    this.setState({
      hook: assocPath(['metadata', 'owner'], e.target.value, this.state.hook)
    });

  handleEmailOnErrorChange = () =>
    this.setState({
      hook: assocPath(
        ['metadata', 'emailOnError'],
        !this.state.hook.metadata.emailOnError,
        this.state.hook
      )
    });

  handleRemoveScheduleItem = index => {
    const schedule = [...this.state.hook.schedule];

    schedule.splice(index, 1);

    this.setState({ hook: { ...this.state.hook, schedule } });
  };

  handleNewScheduleItem = () => {
    const { newScheduleValue } = this.state;

    if (newScheduleValue) {
      this.setState({
        newScheduleValue: '',
        hook: assocPath(
          ['schedule'],
          [...clone(this.state.hook.schedule), newScheduleValue],
          this.state.hook
        )
      });
    }
  };

  handleScheduleTextChange = e =>
    this.setState({
      hook: assocPath(['scheduleText'], e.target.value, this.state.hook)
    });

  handleExpiresChange = e =>
    this.setState({
      hook: assocPath(['expires'], e.target.value, this.state.hook)
    });

  handleDeadlineChange = e =>
    this.setState({
      hook: assocPath(['deadline'], e.target.value, this.state.hook)
    });

  handleTaskChange = value => {
    try {
      this.setState({
        hook: assocPath(['task'], JSON.parse(value), this.state.hook),
        hookValidJson: true
      });
    } catch (err) {
      this.setState({
        hookValidJson: false
      });
    }
  };

  handleTriggerSchemaChange = value => {
    try {
      this.setState({
        hook: assocPath(['triggerSchema'], JSON.parse(value), this.state.hook),
        triggerSchemaValidJson: true
      });
    } catch (err) {
      this.setState({
        triggerSchemaValidJson: false
      });
    }
  };

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
      task: hook.task,
      triggerSchema: hook.triggerSchema
    };
  };

  // TODO: reflect these into state with onChange hooks
  handleCreateHook = () => {
    const { hook } = this.state;

    this.props.onCreateHook(
      hook.hookGroupId,
      hook.hookId,
      this.getHookDefinition()
    );
  };

  handleUpdateHook = () =>
    this.props.handleUpdateHook(this.getHookDefinition());

  renderButtonBar() {
    const { isCreating, hookGroupId, hookId } = this.props;

    if (isCreating) {
      return (
        <ButtonToolbar style={{ float: 'right' }}>
          <Button
            bsStyle="primary"
            onClick={this.handleCreateHook}
            disabled={!this.validHook()}>
            <Glyphicon glyph="plus" /> Create Hook
          </Button>
        </ButtonToolbar>
      );
    }

    return (
      <ButtonToolbar style={{ float: 'right' }}>
        <Button
          bsStyle="success"
          onClick={this.handleUpdateHook}
          disabled={!this.validHook()}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ModalItem
          button
          bsStyle="danger"
          onSubmit={this.props.onDeleteHook}
          body={
            <span>
              Are you sure you want to delete hook{' '}
              <code>
                {hookGroupId}/{hookId}
              </code>?
            </span>
          }>
          <Icon name="trash" /> Delete Hook
        </ModalItem>
      </ButtonToolbar>
    );
  }

  render() {
    const { isCreating, hookGroupId, hookId } = this.props;
    const { hook } = this.state;

    if (this.props.error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.props.onError}>
          <strong>Error executing operation</strong>
          <br />
          {this.props.error.toString()}
        </Alert>
      );
    }

    if (!hook) {
      return null;
    }

    return (
      <div className="form-horizontal">
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="control-label col-md-2">HookGroupId</label>
          <div className="col-md-10">
            {isCreating ? (
              <input
                type="text"
                className="form-control"
                value={hook.hookGroupId}
                onChange={this.handleHookGroupIdChange}
                placeholder="hookGroupId"
              />
            ) : (
              <div className="form-control-static">{hookGroupId}</div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">HookId</label>
          <div className="col-md-10">
            {isCreating ? (
              <input
                type="text"
                className="form-control"
                value={hook.hookId}
                onChange={this.handleHookIdChange}
                placeholder="hookId"
              />
            ) : (
              <div className="form-control-static">{hookId}</div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Name</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.metadata.name}
              onChange={this.handleNameChange}
              placeholder="Hook Name"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Description</label>
          <div className="col-md-10">
            <textarea
              className="form-control"
              defaultValue={hook.metadata.description}
              onChange={this.handleDescriptionChange}
              rows={8}
              placeholder="Hook Description (markdown)"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Owner</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.metadata.owner}
              onChange={this.handleOwnerChange}
              placeholder="Owner email"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">EmailOnError</label>
          <div className="col-md-10">
            <input
              type="checkbox"
              checked={hook.metadata.emailOnError}
              onChange={this.handleEmailOnErrorChange}
            />&nbsp;
            <span className="text-info">
              Email the owner when an error occurs while creating a task. Note:
              to be notified of tasks that fail once created, use{' '}
              <a
                href="https://docs.taskcluster.net/reference/core/taskcluster-notify"
                target="_blank"
                rel="noopener noreferrer">
                notify routes
              </a>.
            </span>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Schedule</label>
          <div className="col-md-10">
            <p className="text-info">
              See{' '}
              <a
                href="https://www.npmjs.com/package/cron-parser"
                target="_blank"
                rel="noopener noreferrer">
                cron-parser
              </a>{' '}
              for format information. Times are in UTC.
            </p>
            <ul style={{ paddingLeft: 20 }}>
              {hook.schedule.map((schedule, index) => (
                <li key={`hook-schedule-${index}`}>
                  <code>{schedule}</code>
                  <Button
                    bsStyle="danger"
                    bsSize="xsmall"
                    onClick={() => this.handleRemoveScheduleItem(index)}>
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
                onChange={this.handleNewScheduleChange}
              />
              <span className="input-group-btn">
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={this.handleNewScheduleItem}>
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
              onChange={this.handleExpiresChange}
              placeholder="Task expiration (relative)"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Deadline</label>
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              defaultValue={hook.deadline}
              onChange={this.handleDeadlineChange}
              placeholder="Task deadline (relative)"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Task Template</label>
          <div className="col-md-10">
            <CodeEditor
              mode="json"
              value={JSON.stringify(hook.task, null, 2)}
              onChange={this.handleTaskChange}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-md-2">Trigger Schema</label>
          <div className="col-md-10">
            <CodeEditor
              mode="json"
              value={JSON.stringify(hook.triggerSchema, null, 2)}
              onChange={this.handleTriggerSchemaChange}
            />
          </div>
        </div>
        {this.renderButtonBar()}
      </div>
    );
  }
}
