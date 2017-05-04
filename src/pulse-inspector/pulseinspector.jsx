import React from 'react';
import {findDOMNode} from 'react-dom';
import {
  Row, Col, ButtonToolbar, Button, Glyphicon, Table, Alert,
  FormGroup, FormControl, ControlLabel,
} from 'react-bootstrap';
import qs from 'qs';
import * as utils from '../lib/utils';
import _ from 'lodash';
import JSONInspector from 'react-json-inspector';
import slugid from 'slugid';
import './pulseinspector.less';

/**
 * Message row implemented to only re-render when strictly necessary
 *
 * Properties expected:
 * - expanded
 * - onClick
 * - message
 *
 * Note, this relies on message._idForInspector to decide when to update.
 * In general there is no reason to reuse these instances.
 */
const MessageRow = React.createClass({
  /** Only update when strictly necessary */
  shouldComponentUpdate(nextProps) {
    // Just compare the _idForInspector
    if (this.props.message._idForInspector !== nextProps.message._idForInspector) {
      return true;
    }

    return this.props.expanded !== nextProps.expanded;
  },

  /** Render a message row*/
  render() {
    const message = this.props.message;
    const hasCustomRoutes = !!message.routes.length;

    if (!this.props.expanded) {
      return (
        <tr onClick={this.handleClick} className="pulse-inspector-unexpanded-message">
          <td><code>{message.exchange}</code></td>
          <td><code>{message.routingKey}</code></td>
        </tr>
      );
    }

    return (
      <tr>
        <td colSpan={2} className="pulse-inspector-expanded-message">
          <dl className="dl-horizontal">
            <dt>Exchange</dt>
            <dd><code>{message.exchange}</code></dd>
            <dt>Routing Key</dt>
            <dd><code>{message.routingKey}</code></dd>
            {hasCustomRoutes ? <dt>Custom Routes</dt> : null}
            {hasCustomRoutes ? (
              <dd>
                <ul>
                  {message.routes.map((route, index) => (
                    <li key={index}><code>route.{route}</code></li>
                  ))}
                </ul>
              </dd>
            ) : null}
          </dl>
          <JSONInspector data={message.payload} />
          <br />
        </td>
      </tr>
    );
  },

  /** handleClick */
  handleClick() {
    // Do this indirectly so we don't have to render if the event handler changes
    this.props.onClick();
  },
});

export default React.createClass({
  displayName: 'PulseInspector',

  /** Initialize mixins */
  mixins: [
    utils.createWebListenerMixin({
      reloadOnKeys: ['bindings', 'doListen'],
    })
  ],

  getDefaultProps() {
    return {
      hashIndex: 0,
    };
  },

  /** Create initial state */
  getInitialState() {
    const query = qs.parse(this.props.location.search.slice(1));
    const bindings = Object.keys(query).map(key => query[key]);

    return {
      doListen: false, // Do start listening
      bindings, // List of bindings
      messages: [], // List of messages received
      expandedMessage: null, // _idForInspector of current message
      listening: false, // State of listening, set by WebListenerMixin
      listeningError: null, // Listening error set by WebListenerMixin
    };
  },

  /** Render User Interface */
  render() {
    return (
      <Row>
        <Col md={12}>
          <h4>Pulse Inspector</h4>
          <p>
            This tool lets you listen to Pulse messages from any exchange and
            routing key. When messages are received you can inspect the
            messages. This is useful for debugging and development when
            consuming from undocumented exchanges. A list of Pulse exchanges is
            maintained on the project Wiki, see&nbsp;
            <a href="https://wiki.mozilla.org/Auto-tools/Projects/Pulse/Exchanges">
              wiki.mozilla.org/Auto-tools/Projects/Pulse/Exchanges
            </a>. Notice that all exchanges from TaskCluster is formally
            documented on <a href="https://docs.taskcluster.net">docs.taskcluster.net</a>.
          </p>
          <hr />
          {this.renderForm()}
          {this.state.listeningError ? this.renderListeningError() : null}
          <hr />
          <ButtonToolbar className="pull-right">
            <Button
              bsSize="sm"
              bsStyle="danger"
              onClick={this.clearBindings}
              disabled={!this.state.bindings.length}>
              <Glyphicon glyph="trash" /> Clear Bindings
            </Button>
          </ButtonToolbar>
          <h5>Bindings</h5>
          {this.renderBindings()}
          <hr />
          <ButtonToolbar className="pull-right">
            <Button
              bsSize="sm"
              bsStyle="success"
              onMouseDown={this.createDownload}
              href="data:application/json;base64,IkJyb3dzZXIgSXNzdWUi"
              ref="downloadLink"
              download="pulse-messages.json"
              disabled={!!this.state.messages.length}>
              <Glyphicon glyph="download-alt" /> Download Messages
            </Button>
          </ButtonToolbar>
          <h5>Messages</h5>
          {this.renderMessages()}
          <br />
          <br />
        </Col>
      </Row>
    );
  },

  createDownload() {
    const params = btoa(JSON.stringify(this.state.messages.map(message => _.pick(
      message, 'exchange', 'routingKey', 'payload')
    ), null, 2));

    this.refs.downloadLink.href = `data:application/json;base64,${params}`;
  },

  /** Clear all bindings */
  clearBindings() {
    this.setState({bindings: [], doListen: false});
    this.props.history.push(this.props.location.pathname);
  },

  /** Render list of bindings */
  renderBindings() {
    // Don't render bindings if we don't have any
    if (!this.state.bindings.length) {
      return <p><em>Please create some bindings...</em></p>;
    }

    return (
      <ul>
        {this.state.bindings.map((binding, index) => (
          <li key={index}>
            <code>{binding.exchange}</code> with <code>{binding.routingKeyPattern}</code>
          </li>
        ))}
      </ul>
    );
  },

  renderForm() {
    return (
      <div className="form">
        <FormGroup>
          <ControlLabel>Pulse Exchange</ControlLabel>
          <div>
            <FormControl
              type="text"
              ref="exchange"
              placeholder="exchange/<username>/some-exchange-name" />
          </div>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Routing Key Pattern</ControlLabel>
          <div>
            <FormControl
              type="text"
              ref="routingKeyPattern"
              placeholder="#.some-interesting-key.#"
              defaultValue="#" />
          </div>
        </FormGroup>
        <div className="form-group">
          <div>
            <ButtonToolbar>
              <Button
                bsStyle="primary"
                onClick={this.addBinding}
                disabled={this.state.listening === null}>
                <Glyphicon glyph="plus" /> Add binding
              </Button>
              {this.state.listening ? (
                <Button bsStyle="danger" onClick={this.dontListen}>
                  <Glyphicon glyph="stop" /> Stop Listening
                </Button>
              ) : (
                <Button
                  bsStyle="success"
                  onClick={this.doListen}
                  disabled={this.state.listening === null}>
                  <Glyphicon glyph="play" /> Start Listening
                </Button>
              )}
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  },

  /** Add binding to list of bindings and update URL */
  addBinding() {
    const binding = {
      exchange: findDOMNode(this.refs.exchange).value,
      routingKeyPattern: findDOMNode(this.refs.routingKeyPattern).value,
    };
    const newBindings = this.state.bindings.concat([binding]);

    this.setState({bindings: this.state.bindings.concat([binding])});
    this.props.history.push(`${this.props.location.pathname}?${qs.stringify(newBindings)}`);
  },

  dontListen() {
    this.setState({doListen: false});
  },

  doListen() {
    this.setState({doListen: true});
  },

  /** return bindings for WebListenerMixin */
  bindings() {
    return !this.state.doListen ? [] : this.state.bindings;
  },

  /** Handle message from WebListener, sent by TaskClusterMixing */
  handleMessage(message) {
    this.setState({messages: [{
      ...message,
      _idForInspector: slugid.nice(),
    }].concat(this.state.messages)});
  },

  /** Render table of messages */
  renderMessages() {
    const expandedMsgId = this.state.expandedMessage;

    return (
      <Table condensed={true} hover={true}>
        <thead>
          <tr>
            <th>Exchange</th>
            <th>Routing Key</th>
          </tr>
        </thead>
        <tbody>
          {this.state.messages.map(message => {
            const msgId = message._idForInspector;
            const expanded = msgId === expandedMsgId;

            return (
              <MessageRow
                key={msgId}
                expanded={expanded}
                message={message}
                onClick={this.expandMessage.bind(this, msgId)} />
            );
          })}
        </tbody>
      </Table>
    );
  },

  /** Set expended message, note we rely on object reference comparison here */
  expandMessage(idForInspector) {
    this.setState({expandedMessage: idForInspector});
  },

  /** Render a listening error */
  renderListeningError() {
    return (
      <Alert bsStyle="danger" onDismiss={this.dismissListeningError}>
        <strong>Listening Error,</strong> {this.state.listeningError.message}
      </Alert>
    );
  },

  /** Dismiss a listening error, basically reset error state */
  dismissListeningError() {
    this.setState({listeningError: null});

    if (!this.state.listening) {
      this.setState({doListen: false});
    }
  },
});
