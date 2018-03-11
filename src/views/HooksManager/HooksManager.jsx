import { PureComponent } from 'react';
import { string } from 'prop-types';
import { ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';
import HookBrowser from './HookBrowser';
import HookEditView from './HookEditView';
import UserSession from '../../auth/UserSession';
import './styles.css';

export default class HooksManager extends PureComponent {
  static propTypes = {
    hookGroupId: string,
    hookId: string
  };

  constructor(props) {
    super(props);

    this.state = {
      groups: null,
      groupsLoaded: [],
      error: null
    };
  }

  componentWillMount() {
    this.handleLoadGroups();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    const needsUpdate =
      nextProps.currentHookGroupId !== this.props.currentHookGroupId ||
      nextProps.currentHookId !== this.props.currentHookId;

    if (needsUpdate) {
      this.handleLoadGroups();
    }
  }

  handleLoadGroups = () => {
    this.setState({ groups: [], groupsLoaded: [] }, async () => {
      try {
        const { groups } = await this.props.hooks.listHookGroups();

        this.setState({
          groups,
          error: null
        });
      } catch (err) {
        this.setState({
          groups: null,
          error: err
        });
      }
    });
  };

  selectHook = (hookGroupId, hookId) => {
    if (hookId && hookId.includes('/')) {
      hookId = encodeURIComponent(hookId); // eslint-disable-line no-param-reassign
    }

    const { history } = this.props;

    if (hookGroupId && hookId) {
      history.push(`/hooks/${hookGroupId}/${hookId}`);
    } else if (hookGroupId) {
      history.push(`/hooks/${hookGroupId}`);
    } else if (!hookGroupId && !hookId) {
      history.push('/hooks/create');
    }
  };

  handleLoadHooksList = loadedGroup => {
    this.setState({
      groupsLoaded: [...new Set([...this.state.groupsLoaded, loadedGroup])]
    });
  };

  groupsReady = () =>
    this.state.groups.every(group => this.state.groupsLoaded.includes(group));

  renderGroups() {
    const { hooks, hookGroupId, hookId } = this.props;
    const { error, groups } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    const groupsReady = this.groupsReady();

    return (
      <div>
        {!groups || !groupsReady ? <Spinner /> : null}
        {groups.map(group => (
          <HookBrowser
            key={group}
            hooks={hooks}
            group={group}
            selectHook={this.selectHook}
            hookGroupId={hookGroupId}
            onLoadHooksList={this.handleLoadHooksList}
            showList={groupsReady}
            hookId={hookId}
          />
        ))}
      </div>
    );
  }

  renderHooks() {
    return (
      <div>
        <HelmetTitle title="Hooks Manager" />
        <h4>Hooks Manager</h4>
        <hr />
        {this.renderGroups()}
        <hr />
        <ButtonToolbar>
          <Button bsStyle="primary" onClick={() => this.selectHook(null, null)}>
            <Glyphicon glyph="plus" /> New Hook
          </Button>
          <Button bsStyle="success" onClick={this.handleLoadGroups}>
            <Glyphicon glyph="refresh" /> Refresh
          </Button>
        </ButtonToolbar>
      </div>
    );
  }

  renderHookEditView(hookGroupId, hookId, hooks) {
    return (
      <HookEditView
        hooks={hooks}
        hookGroupId={hookGroupId}
        hookId={hookId}
        onRefreshHookList={this.handleLoadGroups}
        selectHook={this.selectHook}
      />
    );
  }

  render() {
    const { hookGroupId, hookId, hooks } = this.props;
    const viewHooks = !hookGroupId && !hookId;

    return viewHooks
      ? this.renderHooks()
      : this.renderHookEditView(hookGroupId, hookId, hooks);
  }
}
