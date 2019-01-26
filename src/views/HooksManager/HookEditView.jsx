import { PureComponent } from 'react';
import { string, func } from 'prop-types';
import { omit } from 'ramda';
import { Alert } from 'react-bootstrap';
import Spinner from '../../components/Spinner';
import HookEditor from './HookEditor';
import HookDisplay from './HookDisplay';
import Markdown from '../../components/Markdown';

export default class HookEditView extends PureComponent {
  static propTypes = {
    hookId: string,
    hookGroupId: string,
    onRefreshHookList: func.isRequired,
    selectHook: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      hook: null,
      hookStatus: null,
      hookLastFires: null,
      editing: true,
      error: null
    };
  }

  componentWillMount() {
    this.loadHook(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.hookGroupId !== this.props.hookGroupId ||
      nextProps.hookId !== this.props.hookId
    ) {
      this.loadHook(nextProps);
    }
  }

  async loadHook({ hookGroupId, hookId, hooks }) {
    // Create a new hook if we don't have the hookGroupId and hookId
    if (!hookGroupId || !hookId) {
      return this.setState({
        hook: null,
        editing: true,
        error: null
      });
    }

    try {
      const [hookStatus, hook, { lastFires }] = await Promise.all([
        hooks.getHookStatus(hookGroupId, hookId),
        hooks.hook(hookGroupId, hookId),
        hooks.listLastFires(hookGroupId, hookId)
      ]);

      this.setState({
        hookStatus,
        // Some of the API functions return hook descriptions containing hookId and hookGroupId,
        // but the create and update methods do not take these properties.
        hook: omit(['hookGroupId', 'hookId'], hook),
        hookLastFires: lastFires.sort(
          (a, b) => new Date(b.taskCreateTime) - new Date(a.taskCreateTime)
        ),
        editing: false,
        error: null
      });
    } catch (err) {
      this.setState({
        hook: null,
        hookStatus: null,
        hookLastFires: null,
        editing: false,
        error: err
      });
    }
  }

  startEditing = () => this.setState({ editing: true });

  triggerHook = async context => {
    const { hooks, hookGroupId, hookId } = this.props;

    try {
      // Payloads are ignored, so we send empty data over
      await hooks.triggerHook(hookGroupId, hookId, context || {});

      this.setState({
        hookStatus: await hooks.getHookStatus(hookGroupId, hookId)
      });
    } catch (err) {
      this.setState({ error: err });
    }
  };

  refreshHookStatus = async () => {
    this.setState({ hookStatus: null });

    this.setState({
      hookStatus: await this.props.hooks.getHookStatus(
        this.props.hookGroupId,
        this.props.hookId
      )
    });
  };

  handleCreateHook = async (hookGroupId, hookId, hook) => {
    // add hookId and hookGroupId to the hook, since they are required by the schema

    try {
      const createdHook = await this.props.hooks.createHook(
        hookGroupId,
        hookId,
        hook
      );

      this.props.selectHook(createdHook.hookGroupId, createdHook.hookId);
    } catch (err) {
      this.setState({
        error: err
      });
    }
  };

  handleUpdateHook = async hook => {
    try {
      await this.props.hooks.updateHook(
        this.props.hookGroupId,
        this.props.hookId,
        hook
      );

      this.setState({
        hook: omit(['hookGroupId', 'hookId'], hook),
        editing: false,
        error: null
      });
    } catch (err) {
      this.setState({ error: err });
    }
  };

  handleDeleteHook = async () => {
    await this.props.hooks.removeHook(
      this.props.hookGroupId,
      this.props.hookId
    );
    this.props.selectHook();
  };

  handleDismissError = () => this.setState({ error: null });

  render() {
    const { hookGroupId, hookId } = this.props;
    const { error, editing, hook, hookStatus, hookLastFires } = this.state;

    if (error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.handleDismissError}>
          <strong>Error executing operation</strong>
          <br />
          <Markdown>{error.message}</Markdown>
        </Alert>
      );
    }

    if (!hook && (hookGroupId && hookId)) {
      return <Spinner />;
    }

    const isCreating = !hookGroupId || !hookId;

    if (editing) {
      return (
        <HookEditor
          hook={hook}
          hookId={hookId}
          hookGroupId={hookGroupId}
          isCreating={isCreating}
          onCreateHook={this.handleCreateHook}
          onUpdateHook={this.handleUpdateHook}
          onDeleteHook={this.handleDeleteHook}
        />
      );
    }

    return (
      <HookDisplay
        hook={hook}
        hookStatus={hookStatus}
        hookLastFires={hookLastFires}
        hookId={hookId}
        hookGroupId={hookGroupId}
        startEditing={this.startEditing}
        triggerHook={this.triggerHook}
        refreshHookStatus={this.refreshHookStatus}
      />
    );
  }
}
