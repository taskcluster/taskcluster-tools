import React from 'react';
import { object, string, func } from 'prop-types';
import { NavDropdown, NavItem, MenuItem } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { omit, pathOr } from 'ramda';
import { nice } from 'slugid';
import merge from 'deepmerge';
import clone from 'lodash.clonedeep';
import ModalItem from '../../components/ModalItem';
import { parameterizeTask } from '../../utils';

export default class ActionsMenu extends React.PureComponent {
  static propTypes = {
    queue: object,
    purgeCache: object,
    taskId: string,
    status: object,
    task: object,
    onRetrigger: func,
    onEdit: func,
    onCreateInteractive: func,
    onEditInteractive: func
  };

  constructor(props) {
    super(props);

    const caches = this.getCachesFromTask(props.task);

    this.state = {
      purged: null,
      caches,
      selectedCaches: new Set(caches)
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
  }

  handleSelectCaches = (e) => {
    const selectedCaches = new Set([...this.state.selectedCaches]);

    if (e.target.checked) {
      selectedCaches.add(e.target.value);
    } else {
      selectedCaches.delete(e.target.value);
    }

    this.setState({ selectedCaches });
  };

  getCachesFromTask = task => Object.keys(pathOr({}, ['payload', 'cache'], task));

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

  createTask = async () => {
    const { task, queue } = this.props;
    const taskId = nice();
    const now = Date.now();
    const created = Date.parse(task.created);

    await queue.createTask(taskId, merge(omit(['dependencies'], clone(task)), {
      retries: 0,
      deadline: new Date(now + Date.parse(task.deadline) - created).toJSON(),
      expires: new Date(now + Date.parse(task.expires) - created).toJSON(),
      created: new Date(now).toJSON(),
      dependencies: task.dependencies.filter(requiredTask => requiredTask !== taskId)
    }));
  };

  // copy fields from the parent task, intentionally excluding some
  // fields which might cause confusion if left unchanged
  cloneTask = () => omit([
    'routes',
    'taskGroupId',
    'schedulerId',
    'priority',
    'dependencies',
    'requires'
  ], this.props.task);

  scheduleTask = () => this.props.queue.scheduleTask(this.props.taskId);

  cancelTask = () => this.props.queue.cancelTask(this.props.taskId);

  purge = () => {
    const { purgeCache, task } = this.props;
    const { selectedCaches } = this.state;
    const promises = [];

    selectedCaches.forEach((cacheName) => {
      promises.push(purgeCache.purgeCache(task.provisionerId, task.workerType, { cacheName }));
    });

    return Promise.all(promises);
  };

  createLoaner = async () => {
    const taskId = nice();
    const task = parameterizeTask(this.props.task);

    await this.props.queue.createTask(taskId, task);

    return taskId;
  };

  editTask = () => parameterizeTask(this.props.task);

  scheduleTaskModal() {
    return (
      <span>
        Are you sure you wish to schedule the task? This will <strong>overwrite any scheduling process </strong>
        taking place. If this task is part of a continuous integration process, scheduling this task may cause
        your commit to land with failing tests.
      </span>
    );
  }

  retriggerTaskModal() {
    return (
      <span>
        This will duplicate the task and create it under a different <code>taskId</code>.
        <br /><br />
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
        Are you sure you wish to cancel this task? Note that another process or person may still be able to
        schedule a re-run. All existing runs will be aborted and any scheduling process will not be able to
        schedule the task.
      </span>
    );
  }

  purgeCacheModal() {
    const { caches, selectedCaches } = this.state;

    return (
      <span>
        <p>
          Are you sure you wish to purge caches used in this task across all workers of this worker type?
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
                  value={cache} />
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
        Note that the edited task will not be linked to other tasks nor have the same <code>task.routes</code> as
        other tasks, so this is not a way to fix a failing task in a larger task group.
        Note that you may also not have the scopes required to create the resulting task.
      </span>
    );
  }

  createInteractiveModal() {
    return (
      <span>
        This will duplicate the task and create it under a different <code>taskId</code>.
        <br /><br />
        The new task will be altered to:
        <ul>
          <li>Set <code>task.payload.features.interactive = true</code></li>
          <li>Strip <code>task.payload.caches</code> to avoid poisoning</li>
          <li>Ensures <code>task.payload.maxRunTime</code> is minimum of 60 minutes</li>
          <li>Strip <code>task.routes</code> to avoid side-effects</li>
          <li>Set the environment variable <code>TASKCLUSTER_INTERACTIVE=true</code></li>
        </ul>
        Note: this may not work with all tasks.
      </span>
    );
  }

  editInteractiveModal() {
    return (
      <span>
        This will duplicate and allow you to edit the new task prior to creation. The new task will be altered to:
        <ul>
          <li>Set <code>task.payload.features.interactive = true</code></li>
          <li>Strip <code>task.payload.caches</code> to avoid poisoning</li>
          <li>Ensures <code>task.payload.maxRunTime</code> is minimum of 60 minutes</li>
          <li>Strip <code>task.routes</code> to avoid side-effects</li>
          <li>Set the environment variable <code>TASKCLUSTER_INTERACTIVE=true</code></li>
        </ul>
        Note: this may not work with all tasks.
      </span>
    );
  }

  render() {
    const { taskId } = this.props;

    if (!taskId) {
      return <NavItem disabled>Task Actions</NavItem>;
    }

    const { caches } = this.state;
    const { queue, purgeCache, status, task, onRetrigger, onEdit, onCreateInteractive, onEditInteractive } = this.props;
    const isResolved = status ? ['completed', 'failed', 'exception'].includes(status.state) : false;

    return (
      <NavDropdown title="Task Actions" id="task-view-actions">
        <ModalItem
          disabled={!(queue && task)}
          onSubmit={this.scheduleTask}
          body={this.scheduleTaskModal()}>
          <Icon name="calendar-check-o" /> Schedule Task
        </ModalItem>

        <ModalItem
          onSubmit={this.createTask}
          onComplete={onRetrigger}
          disabled={!(queue && task && task.payload)}
          body={this.retriggerTaskModal()}>
          <Icon name="refresh" /> Retrigger Task
        </ModalItem>

        <ModalItem
          disabled={isResolved}
          onSubmit={this.cancelTask}
          body={this.cancelTaskModal()}>
          <Icon name="calendar-check-o" /> Cancel Task
        </ModalItem>

        <ModalItem
          onSubmit={this.purge}
          disabled={!(purgeCache && task && caches.length)}
          body={this.purgeCacheModal()}>
          <Icon name="refresh" /> Purge Worker Cache
        </ModalItem>

        <MenuItem divider />
        <MenuItem header>Debug</MenuItem>

        <ModalItem
          onSubmit={this.cloneTask}
          onComplete={onEdit}
          disabled={!task}
          body={this.editTaskModal()}>
          <Icon name="edit" /> Edit Task
        </ModalItem>

        <ModalItem
          disabled={!this.isValidTask()}
          onSubmit={this.createLoaner}
          onComplete={onCreateInteractive}
          body={this.createInteractiveModal()}>
          <Icon name="terminal" /> Create Interactive Task
        </ModalItem>

        <ModalItem
          disabled={!this.isValidTask()}
          onSubmit={this.editTask}
          onComplete={onEditInteractive}
          body={this.editInteractiveModal()}>
          <Icon name="edit" /> Edit as Interactive Task
        </ModalItem>
      </NavDropdown>
    );
  }
}
