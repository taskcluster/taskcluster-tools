import React, { Component } from 'react';
import taskcluster from 'taskcluster-client';
import TreeView from 'react-treeview';
import { TaskClusterEnhance } from '../lib/utils';
import * as format from '../lib/format';

class HookBrowser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hooks: null,
      hooksLoading: false,
      hooksLoaded: false,
      hooksError: null
    };

    this.handleClick = this.handleClick.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  render() {
    // forward clicks on the label on to the TreeView's handleClick (undocumented..)
    const label = <code onClick={() => this.tvInstance.handleClick()}>{this.props.group}</code>;

    if (!this.state.hooksLoaded || this.state.hooksError) {
      return (
        <TreeView
          key={this.props.group}
          nodeLabel={label}
          ref={instance => { this.tvInstance = instance; }}
          defaultCollapsed={true}
          onClick={this.handleClick}>
          {
            this.state.hooksError ?
              this.props.renderError(this.state.hooksError) : (
                <format.Icon name="spinner" spin={true} />
              )
          }
        </TreeView>
      );
    }

    return (
      <TreeView
        key={this.props.group}
        nodeLabel={label}
        ref={instance => { this.tvInstance = instance; }}
        defaultCollapsed={false}
        onClick={this.handleClick}>
        {
          this.state.hooks.hooks
            .map(hook => {
              const isSelected = this.props.group === this.props.currentHookGroupId &&
                hook.hookId === this.props.currentHookId;

              return (
                <div
                  key={hook.hookId}
                  className={isSelected ? 'bg-info' : null}
                  onClick={() => this.props.selectHook(this.props.group, hook.hookId)}>
                  <code>{this.props.group}/{hook.hookId}</code>
                </div>
              );
            })
        }
      </TreeView>
    );
  }

  handleClick() {
    if (!this.state.hooksLoading) {
      this.setState({ hooksLoading: true });
      this.props.loadState({
        hooks: this.props.clients.hooks.listHooks(this.props.group)
      });
    }
  }
}

HookBrowser.propTypes = {
  group: React.PropTypes.string.isRequired,
  currentHookGroupId: React.PropTypes.string,
  currentHookId: React.PropTypes.string,
  selectHook: React.PropTypes.func.isRequired
};

const hookBrowserTaskclusterOpts = {
  clients: { hooks: taskcluster.Hooks },
  name: HookBrowser.name
};

const HookBrowserEnhanced = TaskClusterEnhance(HookBrowser, hookBrowserTaskclusterOpts);

class HookGroupBrowser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: null,
      groupsLoaded: false,
      groupsError: null
    };

    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    this.props.loadState({ groups: this.props.clients.hooks.listHookGroups() });
  }

  render() {
    if (!this.state.groupsLoaded) {
      return this.props.renderSpinner();
    }

    try {
      return (
        <div>
          {
            this.state.groups.groups
              .map(group => (
                <HookBrowserEnhanced
                  key={group}
                  group={group}
                  selectHook={this.props.selectHook}
                  currentHookGroupId={this.props.currentHookGroupId}
                  currentHookId={this.props.currentHookId} />
              ))
          }
        </div>
      );
    } catch (e) {
      // TODO: Handle error
    }
  }
}

HookGroupBrowser.propTypes = {
  currentHookGroupId: React.PropTypes.string,
  currentHookId: React.PropTypes.string,
  selectHook: React.PropTypes.func.isRequired
};

const hookGroupBrowserTaskclusterOpts = {
  clients: { hooks: taskcluster.Hooks },
  name: HookGroupBrowser.name
};

export default TaskClusterEnhance(HookGroupBrowser, hookGroupBrowserTaskclusterOpts);
