import { PureComponent } from 'react';
import Ajv from 'ajv';
import jsone from 'json-e';
import { object, string, func } from 'prop-types';
import { Row, Col, NavDropdown, MenuItem } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { omit, pathOr } from 'ramda';
import { nice } from 'slugid';
import merge from 'deepmerge';
import clone from 'lodash.clonedeep';
import jsonSchemaDefaults from 'json-schema-defaults';
import { safeLoad, safeDump } from 'js-yaml';
import ModalItem from '../../components/ModalItem';
import Markdown from '../../components/Markdown';
import CodeEditor from '../../components/CodeEditor';
import Code from '../../components/Code';
import { parameterizeTask } from '../../utils';

export default class ActionsMenu extends PureComponent {
  static propTypes = {
    queue: object,
    userSession: object,
    purgeCache: object,
    taskGroupId: string,
    taskId: string,
    status: object,
    task: object,
    decision: object,
    actions: object,
    onRetrigger: func,
    onEdit: func,
    onCreateInteractive: func,
    onEditInteractive: func,
    onActionTask: func
  };

  constructor(props) {
    super(props);

    const caches = this.getCachesFromTask(props.task);

    this.ajv = new Ajv({ format: 'full', verbose: true, allErrors: true });
    this.state = {
      caches,
      selectedCaches: new Set(caches),
      taskActions: null,
      groupActions: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.task !== this.props.task) {
      const caches = this.getCachesFromTask(nextProps.task);

      this.setState({
        caches,
        selectedCaches: new Set(caches)
      });
    }

    if (
      nextProps.actions !== this.props.actions ||
      nextProps.taskGroupId !== this.props.taskGroupId ||
      nextProps.taskId !== this.props.taskId ||
      nextProps.task !== this.props.task
    ) {
      const actions = nextProps.actions || this.props.actions;
      const task = nextProps.task || this.props.task;
      const taskActions = [];
      const groupActions = [];
      const actionInputs = {};
      const actionData = {};

      if (actions && actions.actions) {
        actions.actions.forEach(action => {
          const schema = action.schema || {};
          const validate = this.ajv.compile(schema);

          actionInputs[action.name] = safeDump(
            jsonSchemaDefaults(schema) || {}
          );
          actionData[action.name] = {
            action,
            validate
          };

          if (!action.context.length) {
            groupActions.push(action.name);
          } else if (
            task &&
            task.tags &&
            this.taskInContext(action.context, task.tags)
          ) {
            taskActions.push(action.name);
          }
        });
      }

      this.setState({
        taskActions,
        groupActions,
        actionInputs,
        actionData
      });
    }
  }

  handleSelectCaches = e => {
    const selectedCaches = new Set([...this.state.selectedCaches]);

    if (e.target.checked) {
      selectedCaches.add(e.target.value);
    } else {
      selectedCaches.delete(e.target.value);
    }

    this.setState({ selectedCaches });
  };

  getCachesFromTask = task =>
    Object.keys(pathOr({}, ['payload', 'cache'], task));

  isValidTask() {
    if (!this.props.task) {
      return false;
    }

    const { payload } = this.props.task;

    if (!payload || !payload.image) {
      return false;
    }

    if (!Array.isArray(payload.command)) {
      return false;
    }

    return typeof payload.maxRunTime === 'number';
  }

  handleCreateTask = async () => {
    const { task, queue } = this.props;
    const taskId = nice();
    const now = Date.now();
    const created = Date.parse(task.created);

    await queue.createTask(
      taskId,
      merge(omit(['dependencies'], clone(task)), {
        retries: 0,
        deadline: new Date(now + Date.parse(task.deadline) - created).toJSON(),
        expires: new Date(now + Date.parse(task.expires) - created).toJSON(),
        created: new Date(now).toJSON()
      })
    );

    return taskId;
  };

  // copy fields from the parent task, intentionally excluding some
  // fields which might cause confusion if left unchanged
  handleCloneTask = () =>
    omit(
      [
        'routes',
        'taskGroupId',
        'schedulerId',
        'priority',
        'dependencies',
        'requires'
      ],
      this.props.task
    );

  handleScheduleTask = () => this.props.queue.scheduleTask(this.props.taskId);

  handleCancelTask = () => this.props.queue.cancelTask(this.props.taskId);

  handlePurge = () => {
    const { purgeCache, task } = this.props;
    const { selectedCaches } = this.state;
    const promises = [];

    selectedCaches.forEach(cacheName => {
      promises.push(
        purgeCache.purgeCache(task.provisionerId, task.workerType, {
          cacheName
        })
      );
    });

    return Promise.all(promises);
  };

  handleCreateLoaner = async () => {
    const taskId = nice();
    const task = parameterizeTask(this.props.task);

    await this.props.queue.createTask(taskId, task);

    return taskId;
  };

  handleEditTask = () => parameterizeTask(this.props.task);

  scheduleTaskModal() {
    return (
      <span>
        Are you sure you wish to schedule the task? This will{' '}
        <strong>overwrite any scheduling process </strong>
        taking place. If this task is part of a continuous integration process,
        scheduling this task may cause your commit to land with failing tests.
      </span>
    );
  }

  retriggerTaskModal() {
    return (
      <span>
        This will duplicate the task and create it under a different{' '}
        <code>taskId</code>.
        <br />
        <br />
        The new task will be altered to:
        <ul>
          <li>Update deadlines and other timestamps for the current time</li>
          <li>Strip self-dependencies from the task definition</li>
        </ul>
        Note: this may not work with all tasks.
      </span>
    );
  }

  cancelTaskModal() {
    return (
      <span>
        Are you sure you wish to cancel this task? Note that another process or
        person may still be able to schedule a re-run. All existing runs will be
        aborted and any scheduling process will not be able to schedule the
        task.
      </span>
    );
  }

  purgeCacheModal() {
    const { caches, selectedCaches } = this.state;

    return (
      <span>
        <p>
          Are you sure you wish to purge caches used in this task across all
          workers of this worker type?
        </p>
        <p>Select the caches to purge:</p>
        <ul>
          {caches.map(cache => (
            <li className="checkbox" key={`purge-cache-${cache}`}>
              <label>
                <input
                  name="cache"
                  type="checkbox"
                  onChange={this.handleSelectCaches}
                  checked={selectedCaches.has(cache)}
                  value={cache}
                />
                {cache}
              </label>
            </li>
          ))}
        </ul>
      </span>
    );
  }

  editTaskModal() {
    return (
      <span>
        Are you sure that you wish to edit this task?<br />
        Note that the edited task will not be linked to other tasks nor have the
        same <code>task.routes</code> as other tasks, so this is not a way to
        fix a failing task in a larger task group. Note that you may also not
        have the scopes required to create the resulting task.
      </span>
    );
  }

  createInteractiveModal() {
    return (
      <span>
        This will duplicate the task and create it under a different{' '}
        <code>taskId</code>.
        <br />
        <br />
        The new task will be altered to:
        <ul>
          <li>
            Set <code>task.payload.features.interactive = true</code>
          </li>
          <li>
            Strip <code>task.payload.caches</code> to avoid poisoning
          </li>
          <li>
            Ensures <code>task.payload.maxRunTime</code> is minimum of 60
            minutes
          </li>
          <li>
            Strip <code>task.routes</code> to avoid side-effects
          </li>
          <li>
            Set the environment variable{' '}
            <code>TASKCLUSTER_INTERACTIVE=true</code>
          </li>
        </ul>
        Note: this may not work with all tasks.
      </span>
    );
  }

  editInteractiveModal() {
    return (
      <span>
        This will duplicate and allow you to edit the new task prior to
        creation. The new task will be altered to:
        <ul>
          <li>
            Set <code>task.payload.features.interactive = true</code>
          </li>
          <li>
            Strip <code>task.payload.caches</code> to avoid poisoning
          </li>
          <li>
            Ensures <code>task.payload.maxRunTime</code> is minimum of 60
            minutes
          </li>
          <li>
            Strip <code>task.routes</code> to avoid side-effects
          </li>
          <li>
            Set the environment variable{' '}
            <code>TASKCLUSTER_INTERACTIVE=true</code>
          </li>
        </ul>
        Note: this may not work with all tasks.
      </span>
    );
  }

  taskInContext(tagSetList, taskTags) {
    return tagSetList.some(tagSet =>
      Object.keys(tagSet).every(
        tag => taskTags[tag] && taskTags[tag] === tagSet[tag]
      )
    );
  }

  handleFormChange = (value, name) =>
    this.setState({
      actionInputs: {
        ...this.state.actionInputs,
        [name]: value
      }
    });

  actionTaskModal = name => {
    const { actionInputs, actionData } = this.state;
    const { action } = actionData[name];
    const form = actionInputs[name];

    return (
      <div>
        <Markdown>{action.description}</Markdown>
        <br />
        {action.schema && (
          <Row>
            <Col lg={6} md={6} sm={12}>
              <h4>Action</h4>
              <CodeEditor
                mode="yaml"
                lint
                value={form}
                onChange={value => this.handleFormChange(value, name)}
              />
            </Col>
            <Col lg={6} md={6} sm={12}>
              <h4>Schema</h4>
              <Code
                language="yaml"
                style={{ maxHeight: 250, overflow: 'scroll' }}>
                {safeDump(action.schema || {})}
              </Code>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  actionTaskSubmit = name => async () => {
    const { task, taskId, taskGroupId, actions } = this.props;
    const { actionInputs, actionData } = this.state;
    const form = actionInputs[name];
    const { validate, action } = actionData[name];
    const input = safeLoad(form);
    const valid = validate(input);

    if (!valid) {
      throw new Error(this.ajv.errorsText(validate.errors));
    }

    const ownTaskId = nice();
    const newTask = jsone(
      action.task,
      merge(
        {
          taskGroupId,
          taskId,
          task,
          input,
          ownTaskId
        },
        actions.variables
      )
    );

    if (!this.props.decision) {
      throw new Error('no action task found'); // .. how did we find an action, then?
    }

    // call the queue with the decision task's scopes, as directed by the action spec
    const actionsQueue = this.props.queue.use({
      authorizedScopes: this.props.decision.scopes || []
    });

    await actionsQueue.createTask(ownTaskId, newTask);

    return ownTaskId;
  };

  render() {
    const { caches, actionData, taskActions, groupActions } = this.state;
    const {
      queue,
      purgeCache,
      status,
      task,
      onRetrigger,
      onEdit,
      onCreateInteractive,
      onEditInteractive,
      onActionTask
    } = this.props;
    const isResolved = status
      ? ['completed', 'failed', 'exception'].includes(status.state)
      : false;

    return (
      <NavDropdown title="Actions" id="task-view-actions">
        <ModalItem
          disabled={!(queue && task)}
          onSubmit={this.handleScheduleTask}
          body={this.scheduleTaskModal()}>
          <Icon name="calendar-check-o" /> Schedule Task
        </ModalItem>

        <ModalItem
          onSubmit={this.handleCreateTask}
          onComplete={onRetrigger}
          disabled={!(queue && task && task.payload)}
          body={this.retriggerTaskModal()}>
          <Icon name="refresh" /> Retrigger Task
        </ModalItem>

        <ModalItem
          disabled={isResolved || !(queue && task)}
          onSubmit={this.handleCancelTask}
          body={this.cancelTaskModal()}>
          <Icon name="calendar-check-o" /> Cancel Task
        </ModalItem>

        <ModalItem
          onSubmit={this.handlePurge}
          disabled={!(purgeCache && task && caches.length)}
          body={this.purgeCacheModal()}>
          <Icon name="refresh" /> Purge Worker Cache
        </ModalItem>

        <MenuItem divider />
        <MenuItem header>Debug</MenuItem>

        <ModalItem
          onSubmit={this.handleCloneTask}
          onComplete={onEdit}
          disabled={!task}
          body={this.editTaskModal()}>
          <Icon name="edit" /> Edit Task
        </ModalItem>

        <ModalItem
          disabled={!this.isValidTask()}
          onSubmit={this.handleCreateLoaner}
          onComplete={onCreateInteractive}
          body={this.createInteractiveModal()}>
          <Icon name="terminal" /> Create Interactive Task
        </ModalItem>

        <ModalItem
          disabled={!this.isValidTask()}
          onSubmit={this.handleEditTask}
          onComplete={onEditInteractive}
          body={this.editInteractiveModal()}>
          <Icon name="edit" /> Edit as Interactive Task
        </ModalItem>

        <MenuItem divider />
        <MenuItem header>Task Actions</MenuItem>
        {taskActions &&
          taskActions.map(action => (
            <ModalItem
              modalSize={actionData[action].action.schema ? 'large' : null}
              body={this.actionTaskModal(action)}
              onSubmit={this.actionTaskSubmit(action)}
              onComplete={onActionTask(action)}
              key={`taskaction-modal-item-${action}`}>
              <Icon name="keyboard-o" /> {actionData[action].action.title}
            </ModalItem>
          ))}
        {taskActions === null && <MenuItem disabled>Loading...</MenuItem>}

        <MenuItem divider />
        <MenuItem header>Group Actions</MenuItem>
        {groupActions &&
          groupActions.map(action => (
            <ModalItem
              modalSize={actionData[action].action.schema ? 'large' : null}
              body={this.actionTaskModal(action)}
              onSubmit={this.actionTaskSubmit(action)}
              onComplete={onActionTask(action)}
              key={`groupaction-modal-item-${action}`}>
              <Icon name="keyboard-o" /> {actionData[action].action.title}
            </ModalItem>
          ))}
        {groupActions === null && <MenuItem disabled>Loading...</MenuItem>}
      </NavDropdown>
    );
  }
}
