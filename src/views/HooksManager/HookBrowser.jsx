import { Component } from 'react';
import { string, func, object } from 'prop-types';
import TreeView from 'react-treeview';
import 'react-treeview/react-treeview.css';
import Error from '../../components/Error';

export default class HookBrowser extends Component {
  static propTypes = {
    group: string.isRequired,
    hookGroupId: string,
    hookId: string,
    selectHook: func.isRequired,
    hooks: object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      hooksList: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadHooksList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.group !== this.props.group) {
      this.loadHooksList(nextProps);
    }
  }

  async loadHooksList({ hooks, group, onLoadHooksList }) {
    const { hooks: hooksList } = await hooks.listHooks(group);

    try {
      this.setState({
        hooksList,
        error: null
      });
    } catch (err) {
      this.setState({
        hooksList: null,
        error: err
      });
    }

    onLoadHooksList(group);
  }

  registerChild = ref => (this.treeView = ref);

  handleLabelClick = () => this.treeView && this.treeView.handleClick();

  handleClick = () => this.loadHooksList(this.props);

  render() {
    const { group, hookGroupId, showList } = this.props;
    const { hooksList, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    // For nodeLabel: forward clicks on the label on to the TreeView's handleClick (undocumented..)
    return (
      showList &&
      hooksList && (
        <TreeView
          key={group}
          nodeLabel={<code onClick={this.handleLabelClick}>{group}</code>}
          ref={this.registerChild}
          defaultCollapsed={false}
          onClick={this.handleClick}>
          {hooksList.map(({ hookId }) => (
            <div
              key={hookId}
              style={{ cursor: 'pointer' }}
              className={
                group === hookGroupId && hookId === this.props.hookId
                  ? 'bg-info'
                  : null
              }
              onClick={() => this.props.selectHook(group, hookId)}>
              <code>
                {group}/{hookId}
              </code>
            </div>
          ))}
        </TreeView>
      )
    );
  }
}
