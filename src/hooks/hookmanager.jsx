import React, {Component} from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon} from 'react-bootstrap';
import path from 'path';
import HookGroupBrowser from './hookgroupbrowser';
import HookEditView from './hookeditor';
import {TaskClusterEnhance} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import './hookmanager.less';

class HookManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentHookGroupId: this.props.match.params.hookGroupId,
      currentHookId: this.props.match.params.hookId
    };

    this.refreshHookList = this.refreshHookList.bind(this);
    this.selectHook = this.selectHook.bind(this);
  }

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
            ref={instance => { this.hookGroupBrowserInstance = instance; }}
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
            {...this.props}
            currentHookId={hookId}
            currentHookGroupId={hookGroupId}
            refreshHookList={this.refreshHookList}
            selectHook={this.selectHook} />
        </Col>
      </Row>
    );
  }

  refreshHookList() {
    this.hookGroupBrowserInstance.getWrappedInstance().load();
  }

  selectHook(hookGroupId, hookId) {
    this.props.history.push(path.join('/hooks', hookGroupId ? hookGroupId : '', hookId ? hookId : ''));
  }
}

const taskclusterOpts = {
  clients: {
    hooks: taskcluster.Hooks,
  },
  name: HookManager.name
};

export default TaskClusterEnhance(HookManager, taskclusterOpts);
