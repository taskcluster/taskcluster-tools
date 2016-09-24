import React from 'react';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../lib/format';
import TreeView from 'react-treeview';

const HookBrowser = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks: taskcluster.Hooks
      }
    })
  ],

  propTypes: {
    group: React.PropTypes.string.isRequired,
    currentHookGroupId: React.PropTypes.string,
    currentHookId: React.PropTypes.string,
    selectHook: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      hooks: null,
      hooksLoading: false,
      hooksLoaded: false,
      hooksError: null
    };
  },

  render() {
    // forward clicks on the label on to the TreeView's handleClick (undocumented..)
    const label = <code onClick={() => this.refs.tv.handleClick()}>{this.props.group}</code>;

    if (!this.state.hooksLoaded || this.state.hooksError) {
      return (
        <TreeView
          key={this.props.group}
          nodeLabel={label}
          ref="tv"
          defaultCollapsed={true}
          onClick={this.handleClick}>
            {
              this.state.hooksError ?
                this.renderError(this.state.hooksError) :
                <format.Icon name="spinner" spin />
            }
       </TreeView>
      );
    }

    return (
      <TreeView
        key={this.props.group}
        nodeLabel={label}
        ref="tv"
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
  },

  handleClick() {
    if (!this.state.hooksLoading) {
      this.setState({ hooksLoading: true });
      this.loadState({
        hooks: this.hooks.listHooks(this.props.group)
      });
    }
  }
});

const HookGroupBrowser = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks: taskcluster.Hooks
      }
    })
  ],

  propTypes: {
    currentHookGroupId: React.PropTypes.string,
    currentHookId: React.PropTypes.string,
    selectHook: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      groups: null,
      groupsLoaded: false,
      groupsError: null
    };
  },

  load() {
    return {
      groups: this.hooks.listHookGroups()
    };
  },

  render() {
    const waitFor = this.renderWaitFor('groups');

    if (waitFor) {
      return waitFor;
    }

    try {
      return (
        <div>
          {
            this.state.groups.groups
              .map(group => (
                <HookBrowser
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
      console.log(e);
    }
  }
});

export default HookGroupBrowser;
