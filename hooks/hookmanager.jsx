var React            = require('react');
var bs               = require('react-bootstrap');
var HookGroupBrowser = require('./hookgroupbrowser');
var HookEditView     = require('./hookeditor');
var utils            = require('../lib/utils');
var taskcluster      = require('taskcluster-client');

var HookManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.Hooks
      }
    }),
    utils.createLocationHashMixin({
      keys:                   ['currentHookGroupId', 'currentHookId'],
      type:                   'string'
    })
  ],

  /** Create an initial state */
  getInitialState: function () {
    return {
      currentHookGroupId:   undefined,
      currentHookId:        undefined,
    };
  },

  /** Render the main layout of the hooks manager page */
  render: function () {
    var creating = this.state.currentHookGroupId === undefined
                && this.state.currentHookId === undefined;
    return (
      <bs.Row>
        <bs.Col md={4}>
          <h3>Hooks</h3>
          <HookGroupBrowser ref="hookgroupbrowser"
                currentHookGroupId={this.state.currentHookGroupId}
                currentHookId={this.state.currentHookId}
                selectHook={this.selectHook} />
          <hr />
          <bs.ButtonToolbar>
            <bs.Button bsStyle="primary"
              disabled={creating}
              onClick={this.selectHook.bind(this, undefined, undefined)}>
              <bs.Glyphicon glyph="plus"/>
              &nbsp;
              New Hook
            </bs.Button>
            <bs.Button bsStyle="success"
              onClick={this.refreshHookList}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
        <bs.Col md={8}>
          <HookEditView currentHookId={this.state.currentHookId}
                        currentHookGroupId={this.state.currentHookGroupId}
                        refreshHookList={this.refreshHookList}
                        selectHook={this.selectHook} />
        </bs.Col>
      </bs.Row>
    );
  },

  refreshHookList() {
    this.refs.hookgroupbrowser.reload();
  },

  selectHook(hookGroupId, hookId) {
    this.setState({
      currentHookGroupId:   hookGroupId,
      currentHookId:        hookId
    });
  }
});

// Export HookManager
module.exports = HookManager;
