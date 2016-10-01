import React from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import HookGroupBrowser from './hookgroupbrowser';
import HookEditView from './hookeditor';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import './hookmanager.less';

export default React.createClass({
  displayName: 'HookManager',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks: taskcluster.Hooks
      }
    }),
    utils.createLocationHashMixin({
      keys: ['currentHookGroupId', 'currentHookId'],
      type: 'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      currentHookGroupId: null,
      currentHookId: null
    };
  },

  /** Render the main layout of the hooks manager page */
  render() {
    const creating = this.state.currentHookGroupId == null && this.state.currentHookId == null;

    return (
      <Row>
        <Col md={4}>
          <h4>Hooks</h4>
          <hr />
          <HookGroupBrowser
            ref="hookgroupbrowser"
            currentHookGroupId={this.state.currentHookGroupId}
            currentHookId={this.state.currentHookId}
            selectHook={this.selectHook} />
          <hr />
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              disabled={creating}
              onClick={this.selectHook.bind(this, null, null)}>
                <Glyphicon glyph="plus" /> New Hook
            </Button>
            <Button bsStyle="success" onClick={this.refreshHookList}>
              <Glyphicon glyph="refresh"/> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={8}>
          <HookEditView
            currentHookId={this.state.currentHookId}
            currentHookGroupId={this.state.currentHookGroupId}
            refreshHookList={this.refreshHookList}
            selectHook={this.selectHook} />
        </Col>
      </Row>
    );
  },

  refreshHookList() {
    this.refs.hookgroupbrowser.reload();
  },

  selectHook(hookGroupId, hookId) {
    this.setState({
      currentHookGroupId: hookGroupId,
      currentHookId: hookId
    });
  }
});
