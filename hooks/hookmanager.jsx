var React           = require('react');
var bs              = require('react-bootstrap');
var HookEditor      = require('./hookeditor');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');
var _               = require('lodash');

var reference = require('./reference');

/** Create hook manager */
var HookManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.createClient(reference)
      }
    })
  ],

  /** Create an initial state */
  getInitialState: function () {
    return {
      currentGroupId: undefined,
      currentHookId:  undefined,
      groups:        {groups: []},
      groupsLoaded:  true,
      groupsError:   undefined,
      hooks:         {hooks: []},
      hooksLoaded:   false,
      hooksError:    undefined,
      tabKey:        1
    };
  },

  load: function () {
    return {
      groups: this.hooks.listHookGroups(),
      hooks:  this.state.currentGroupId ?
        this.hooks.listHooks(this.state.currentGroupId) :
        Promise.reject()
    };
  },

  /** Render the main layout of the hooks manager page */
  render: function () {
    return (
      <bs.Row>
        <bs.Col md={4}>
          {this.renderBreadcrumbs()}
          {this.renderHooksBrowser()}
          {this.renderButtonToolbar()}
        </bs.Col>
        <bs.Col md={8}>
          <HookEditor currentHookId={this.state.currentHookId}
                      currentGroupId={this.state.currentGroupId}
                      refreshHookList={this.reload}/>
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

  renderBreadcrumbs: function () {
    return (
      <ol className="breadcrumb namespace-breadcrumbs">
        <li key={-1}>
          <a onClick={this.browse.bind(this, undefined, undefined, 1)}>
            home
          </a>
        </li>
        {
          // Mark the current groupId
          this.state.currentGroupId ?
            (
              <li key={0} className={(this.state.currentHookId == undefined) ? "active" : ""}>
                <a onClick={this.browse.bind(this, this.state.currentGroupId, undefined, 2)}>
                  {this.state.currentGroupId}
                </a>
              </li>
            ) : undefined
        }
        {
          this.state.currentHookId ?
            (<li className="active" key={1}>{this.state.currentHookId}</li>) :
            undefined
        }
      </ol>
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
    if (groupId && groupId !== this.state.currentGroupId) {
      this.loadState({
        hooks: this.hooks.listHooks(groupId)
      });
    }
    var state = {
      currentGroupId:  groupId,
      currentHookId:   hookId,
      tabKey:          key,
    };
    this.setState(state);
  }
});

// Export HookManager
module.exports = HookManager;
