var React           = require('react');
var bs              = require('react-bootstrap');
var HookEditor      = require('./hookeditor');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');
var _               = require('lodash');
var TreeView        = require('react-treeview');


var HookBrowser = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      }
    })
  ],

  propTypes: {
    group: React.PropTypes.string.isRequired,
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
    if (!this.state.hooksLoaded || this.state.hooksError) {
      // using renderWaitFor here messes the vertical spacing of the elements
      return <TreeView key={this.props.group} nodeLabel={this.props.group}
                       defaultCollapsed={true} onClick={this.handleClick}>
               {this.state.hooksError ? (
                 this.renderError(this.state.hooksError)
               ) : (
                 <format.Icon name="spinner" spin/>
               )}
             </TreeView>
    } else {
      try {
      return <TreeView key={this.props.group} nodeLabel={this.props.group}
                       defaultCollapsed={false} onClick={this.handleClick}>
               {this.state.hooks.hooks.map((h) => <div key={h.hookId}>{h.hookId}</div>)}
             </TreeView>
      } catch(e) { console.log(e); }
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
      }
    })
  ],

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
          return <HookBrowser key={group} group={group} />
        })
      }</div>;
      } catch (e) {
        console.log(e);
      }
    }
  },
});

var HookManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      }
    })
  ],

  /** Create an initial state */
  getInitialState: function () {
    return {
      currentHookGroupId:   undefined,
      currentHookId:        undefined,
      groups:               {groups: []},
      groupsLoaded:         true,
      groupsError:          undefined,
      hooks:                {hooks: []},
      hooksLoaded:          false,
      hooksError:           undefined,
      tabKey:               1
    };
  },

  load: function () {
    return {
      groups: this.hooks.listHookGroups(),
      hooks:  this.state.currentHookGroupId ?
        this.hooks.listHooks(this.state.currentHookGroupId) :
        Promise.reject()
    };
  },

  /** Render the main layout of the hooks manager page */
  render: function () {
    return (
      <bs.Row>
        <bs.Col md={4}>
          <HookGroupBrowser />
          {this.renderButtonToolbar()}
        </bs.Col>
        <bs.Col md={8}>
          {this.state.currentHookId} / {this.state.currentHookGroupId}
          /*<HookEditor currentHookId={this.state.currentHookId}
                      currentHookGroupId={this.state.currentHookGroupId}
                      refreshHookList={this.reload}/>*/
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render the button toolbar to add a client or refresh */
  renderButtonToolbar: function () {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
          onClick={this.browse.bind(this, undefined, undefined, 1)}>
          <bs.Glyphicon glyph="plus"/>
          &nbsp;
          Add Hook
        </bs.Button>
        <bs.Button bsStyle="success"
          onClick={this.reload}>
          <bs.Glyphicon glyph="refresh"/>
          &nbsp;
          Refresh
        </bs.Button>
      </bs.ButtonToolbar>
    );
  },

  renderHooksBrowser: function() {
    return (
      <bs.TabbedArea activeKey={this.state.tabKey} onSelect={this.setTabKey}>
        <bs.TabPane eventKey={1}
                    tab="Groups"
                    active={(this.state.tabKey === 1) ? "active" : ""}>
          {this.renderWaitFor('groups') || this.renderGroups()}
        </bs.TabPane>
        <bs.TabPane eventKey={2}
                    tab="Hooks"
                    active={(this.state.tabKey === 2) ? "active" : ""}>
          {this.renderWaitFor('hooks') || this.renderHooks()}
        </bs.TabPane>
      </bs.TabbedArea>
    );
  },

  renderGroups: function () {
    return (
      <span>
        <bs.Table condensed hover className="hook-table">
          <tbody>
            {
              this.state.groups.groups.map(function(group, index) {
                return (
                  <tr key={index}>
                    <td onClick={this.browse.bind(this, group, undefined, 2)}>{group}</td>
                  </tr>
                  );
              }, this)
            }
          </tbody>
        </bs.Table>
      </span>
    );
  },

  renderHooks: function () {
    return (
      <span>
        <bs.Table condensed hover className="hook-table">
          <tbody>
            {
              this.state.hooks.hooks.map(function(hook, index) {
                return(
                  <tr key={index}>
                    <td onClick={this.setCurrentHook.bind(this, hook.hookId)}>
                      {hook.hookId} - {hook.metadata.name} - {hook.metadata.description}
                    </td>
                  </tr>
                );
              }, this)
              }
           </tbody>
        </bs.Table>
      </span>
    );
  },

  setTabKey(key) {
    this.setState({
      tabKey: key
    });
  },

  setCurrentHook(hook) {
    this.setState({
      currentHookId: hook
    });
  },

  browse: function (groupId, hookId, key) {
    if (groupId && groupId !== this.state.currentHookGroupId) {
      this.loadState({
        hooks: this.hooks.listHooks(groupId)
      });
    }
    var state = {
      currentHookGroupId:   groupId,
      currentHookId:        hookId,
      tabKey:               key,
    };
    this.setState(state);
  }
});

// Export HookManager
module.exports = HookManager;
