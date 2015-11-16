var React           = require('react');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');
var TreeView        = require('react-treeview');

var HookBrowser = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      },
    })
  ],

  propTypes: {
    group:              React.PropTypes.string.isRequired,
    currentHookGroupId: React.PropTypes.string,
    currentHookId:      React.PropTypes.string,
    selectHook:         React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return {
      hooks:        undefined,
      hooksLoading: false,
      hooksLoaded:  false,
      hooksError:   undefined,
    };
  },

  render: function() {
    // forward clicks on the label on to the TreeView's handleClick (undocumented..)
    let label = <code onClick={() => {this.refs.tv.handleClick()}}>{this.props.group}</code>;
    if (!this.state.hooksLoaded || this.state.hooksError) {
      return <TreeView key={this.props.group} nodeLabel={label} ref="tv"
                       defaultCollapsed={true} onClick={this.handleClick}>
               {this.state.hooksError ? (
                 this.renderError(this.state.hooksError)
               ) : (
                 <format.Icon name="spinner" spin/>
               )}
             </TreeView>
    } else {
      return <TreeView key={this.props.group} nodeLabel={label} ref="tv"
                       defaultCollapsed={false} onClick={this.handleClick}>
               {
                 this.state.hooks.hooks.map((h) => {
                   let isSelected = this.props.group == this.props.currentHookGroupId &&
                                    h.hookId == this.props.currentHookId;
                   return <div key={h.hookId} className={isSelected ? 'bg-info' : undefined}
                               onClick={() => this.props.selectHook(this.props.group, h.hookId)} >
                            <code>{this.props.group}/{h.hookId}</code>
                          </div>;
                 })
               }
             </TreeView>
    }
  },

  handleClick: function() {
    if (!this.state.hooksLoading) {
      this.setState({
        hooksLoading: true,
      });
      this.loadState({
        hooks: this.hooks.listHooks(this.props.group),
      });
    }
  },
});

var HookGroupBrowser = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      },
    })
  ],

  propTypes: {
    currentHookGroupId: React.PropTypes.string,
    currentHookId:      React.PropTypes.string,
    selectHook:         React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return {
      groups:       undefined,
      groupsLoaded: false,
      groupsError:  undefined,
    };
  },

  load: function() {
    return {
      groups: this.hooks.listHookGroups()
    };
  },

  render: function() {
    var waitFor = this.renderWaitFor('groups');
    if (waitFor) {
      return waitFor;
    } else {
      try {
      return <div>{
        this.state.groups.groups.map((group) => {
          return <HookBrowser key={group} group={group}
                              selectHook={this.props.selectHook}
                              currentHookGroupId={this.props.currentHookGroupId}
                              currentHookId={this.props.currentHookId} />
        })
      }</div>;
      } catch (e) {
        console.log(e);
      }
    }
  },
});


module.exports = HookGroupBrowser;
