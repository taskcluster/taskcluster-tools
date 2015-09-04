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
      },
      reloadOnKeys: ['currentGroupId']
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
      hooks: this.state.currentGroupId ?
        this.hooks.listHooks(this.state.currentGroupId) :
        {hooks: []}
    };
  },

  /** Render the main layout of the hooks manager page */
  render: function () {
    return (
      <bs.Row>
        <bs.Col md={4}>
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
          onClick={this.browseGroup.bind(this, undefined, 1)}>
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
                    <td onClick={this.browseGroup.bind(this, group, 2)}>{group}</td>
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

  browseGroup: function (groupId, key) {
    var state = {
      currentGroupId:  groupId,
      currentHookId:   undefined,
      tabKey:          key,
    };
    this.setState(state);
  }
});

// Export HookManager
module.exports = HookManager;
