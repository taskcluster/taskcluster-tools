import React from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon} from 'react-bootstrap';
import path from 'path';
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
        hooks: taskcluster.Hooks,
      },
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      currentHookGroupId: this.props.match.params.hookGroupId,
      currentHookId: this.props.match.params.hookId,
    };
  },

  /** Render the main layout of the hooks manager page */
  render() {
    const {hookId, hookGroupId} = this.props.match.params;
    const creating = !hookGroupId && !hookId;

    return (
      <Row>
        <Col md={4}>
          <h4>Hooks</h4>
          <hr />
          <HookGroupBrowser
            ref="hookgroupbrowser"
            currentHookGroupId={hookGroupId}
            currentHookId={hookId}
            selectHook={this.selectHook} />
          <hr />
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              disabled={creating}
              onClick={() => this.selectHook(null, null)}>
              <Glyphicon glyph="plus" /> New Hook
            </Button>
            <Button bsStyle="success" onClick={this.refreshHookList}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={8}>
          <HookEditView
            currentHookId={hookId}
            currentHookGroupId={hookGroupId}
            refreshHookList={this.refreshHookList}
            selectHook={this.selectHook}
            {...this.props} />
        </Col>
      </Row>
    );
  },

  refreshHookList() {
    this.refs.hookgroupbrowser.reload();
  },

  selectHook(hookGroupId, hookId) {
    this.props.history.push(path.join('/', 'hooks', hookGroupId ? hookGroupId : '', hookId ? hookId : ''));
  },
});
