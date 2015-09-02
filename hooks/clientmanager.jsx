var React           = require('react');
var bs              = require('react-bootstrap');
var ClientEditor    = require('./clienteditor');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');

var reference = require('./reference');

/** Create client manager */
var ClientManager = React.createClass({
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
      hooksLoaded:   true,
      hooksError:    undefined
    };
  },

  load: function () {
    return {
      groups: this.hooks.listHookGroups(),
      hooks: []
    };
  },

  /** Render the main layout of the hooks manager page */
  render: function () {
    return (
      <bs.Row>
        <bs.Col md={6}>
          {this.renderHooksBrowser()}
          {this.renderButtonToolbar()}
        </bs.Col>
        <bs.Col md={6}>
          <ClientEditor currentHookId={this.state.currentHookId}
                        currentGroupId={this.state.currentGroupId}
                        refreshClientList={this.reload}/>
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render the button toolbar to add a client or refresh */
  renderButtonToolbar: function () {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
          onClick={this.browse.bind(this, undefined, undefined)}>
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
      <bs.TabbedArea defaultActiveKey={1}>
        <bs.TabPane eventKey={1} tab="Groups">
          {this.renderWaitFor('groups') || this.renderGroups()}
        </bs.TabPane>
        <bs.TabPane eventKey={2} tab="Hooks">
          {this.renderWaitFor('hooks') || this.renderHooks()}
        </bs.TabPane>
      </bs.TabbedArea>
    );
  },

  renderGroups: function () {
    return (
      <span>
        <bs.Table condensed hover className="group-table">
          <tbody>
            {
              this.state.groups.groups.map(function(group, index) {
                return (
                  <tr key={index}>
                    <td onClick={this.browse.bind(this, group, undefined)}>{group}</td>
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
  },

  browse: function (groupId, hookId) {
    this.setState({
      currentGroupId: groupId,
      currentHookId: hookId
    });
  }

});

// Export ClientManager
module.exports = ClientManager;
