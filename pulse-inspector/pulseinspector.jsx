/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');
var _               = require('lodash');
var JSONInspector   = require('react-json-inspector');


var PulseInspector = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createWebListenerMixin({
      startOnMount:     false
    })
  ],

  /** Create initial state */
  getInitialState: function() {
    return {
      bindings:         [],       // List of bindings
      messages:         [],       // List of messages received
      expandedMessage:  null,     // Currently expanded message
      listening:        false,    // State of listening, set by WebListenerMixin
      listeningError:   undefined // Listening error set  by WebListenerMixin
    };
  },

  /** Render User Interface */
  render: function() {
    return (
      <bs.Row>
        <bs.Col md={12}>
          <h1>Pulse Inspector</h1>
          <p>
            This tool let's you listen to Pulse messages from any exchange and
            routing key, when messages are received you can inspect the
            messages. This is useful for debugging and development when
            consuming from undocumented exchanges. A list of Pulse exchanges is
            maintained on the project Wiki, see&nbsp;
            <a href="https://wiki.mozilla.org/Auto-tools/Projects/Pulse/Exchanges">
              wiki.mozilla.org/Auto-tools/Projects/Pulse/Exchanges
            </a>. Notice that all exchanges from TaskCluster is formally
            documented on&nbsp;
            <a href="http://docs.taskcluster.net">docs.taskcluster.net</a>.
          </p>
          {this.renderForm()}
          {this.state.listeningError ? this.renderListeningError() : undefined}
          <hr/>
          <bs.ButtonToolbar className="pull-right">
            <bs.Button bsStyle="danger"
                       onClick={this.clearBindings}
                       disabled={this.state.bindings.length === 0}>
              <bs.Glyphicon glyph="trash"/>&nbsp;
              Clear Bindings
            </bs.Button>
          </bs.ButtonToolbar>
          <h2>Bindings</h2>
          {this.renderBindings()}
          <hr/>
          <bs.ButtonToolbar className="pull-right">
            <bs.Button bsStyle="success"
                       onMouseDown={this.createDownload}
                       href="data:application/json;base64,IkJyb3dzZXIgSXNzdWUi"
                       ref="downloadLink"
                       download="pulse-messages.json"
                       disabled={this.state.messages.length === 0}>
              <bs.Glyphicon glyph="download-alt"/>&nbsp;
              Download Messages
            </bs.Button>
          </bs.ButtonToolbar>
          <h2>Messages</h2>
          {this.renderMessages()}
          <br/>
          <br/>
        </bs.Col>
      </bs.Row>
    );
  },

  createDownload: function() {
    console.log(this.refs.downloadLink.getDOMNode());
    console.log(this.refs.downloadLink.getDOMNode().href);
    var downloadUrl = "data:application/json;base64," + btoa(JSON.stringify(
      this.state.messages,
      null,
      2
    ));
    this.refs.downloadLink.getDOMNode().href = downloadUrl;
  },

  /** Clear all bindings */
  clearBindings: function() {
    this.setState({bindings: []});
    this.stopListening();
  },

  /** Render list of bindings */
  renderBindings: function() {
    // Don't render bindings if we don't have any
    if (this.state.bindings.length === 0) {
      return <p><i>Please create some bindings...</i></p>;
    }

    return (
      <ul>
        {
          this.state.bindings.map(function(binding, index) {
            return (
              <li key={index}>
                <code>{binding.exchange}</code> with&nbsp;
                <code>{binding.routingKeyPattern}</code>
              </li>
            );
          })
        }
      </ul>
    );
  },

  renderForm: function() {
    return (
      <div className="form form-horizontal">
        <bs.Input type="text"
                  ref="exchange"
                  label="Pulse Exchange"
                  placeholder="exchange/<username>/some-exchange-name"
                  labelClassName="col-xs-3"
                  wrapperClassName="col-xs-9"/>
        <bs.Input type="text"
                  ref="routingKeyPattern"
                  label="Routing Key Pattern"
                  placeholder="#.some-interesting-key.#"
                  defaultValue="#"
                  labelClassName="col-xs-3"
                  wrapperClassName="col-xs-9"/>
        <div className="form-group">
          <div className="col-xs-offset-3 col-xs-9">
            <bs.ButtonToolbar>
              <bs.Button bsStyle="primary"
                         onClick={this.addBinding}
                         disabled={this.state.listening === null}>
                <bs.Glyphicon glyph="plus"/>&nbsp;
                Add binding
              </bs.Button>
              {
                this.state.listening ? (
                  <bs.Button bsStyle="danger"
                             onClick={this.stopListening}>
                    <bs.Glyphicon glyph="stop"/>&nbsp;
                    Stop Listening
                  </bs.Button>
                ) : (
                  <bs.Button bsStyle="success"
                             onClick={this.setupListener}
                             disabled={this.state.listening === null}>
                    <bs.Glyphicon glyph="play"/>&nbsp;
                    Start Listening
                  </bs.Button>
                )
              }
            </bs.ButtonToolbar>
          </div>
        </div>
      </div>
    );
  },

  /** Add binding to list of bindings */
  addBinding: function() {
    var bindings = _.cloneDeep(this.state.bindings);
    var binding = {
      exchange:           this.refs.exchange.getValue(),
      routingKeyPattern:  this.refs.routingKeyPattern.getValue()
    };
    bindings.push(binding);
    this.setState({bindings: bindings});
    if (this.state.listening) {
      this.startListening([binding]);
    }
  },

  /** Setup listener */
  setupListener: function() {
    this.startListening(this.state.bindings);
  },

  /** Handle message from WebListener, sent by TaskClusterMixing */
  handleMessage: function(message) {
    var messages = _.cloneDeep(this.state.messages);
    messages.unshift(message);
    this.setState({messages: messages});
    console.log(message);
  },

  /** Render table of messages */
  renderMessages: function() {
    return (
      <bs.Table condensed hover>
        <thead>
          <tr>
            <th>Exchange</th>
            <th>Routing Key</th>
          </tr>
        </thead>
        <tbody>
          {
            this.state.messages.map(function(message, index) {
              if (message === this.state.expandedMessage) {
                return (
                  <tr key={index}>
                    {this.renderMessage(message)}
                  </tr>
                );
              }
              return (
                <tr key={index}
                    onClick={this.expandMessage.bind(this, message)}
                    className="pulse-inspector-unexpanded-message">
                  <td><code>{message.exchange}</code></td>
                  <td><code>{message.routingKey}</code></td>
                </tr>
              );
            }, this)
          }
        </tbody>
      </bs.Table>
    );
  },

  /** Render an expanded message */
  renderMessage: function(message) {
    var hasCustomRoutes = (message.routes.length > 0);
    return (
      <td colSpan={2} className="pulse-inspector-expanded-message">
        <dl className="dl-horizontal">
          <dt>Exchange</dt>
          <dd><code>{message.exchange}</code></dd>
          <dt>Routing Key</dt>
          <dd><code>{message.routingKey}</code></dd>
          {
            hasCustomRoutes ?
              <dt>Custom Routes</dt>
            :
              undefined
          }
          {
            hasCustomRoutes ?
              <dd>
                <ul>
                  {
                    message .routes.map(function(route, index) {
                      return <li key={index}><code>{route}</code></li>;
                    })
                  }
                </ul>
              </dd>
            :
              undefined
          }
        </dl>
        <JSONInspector data={message.payload}/>
        <br/>
      </td>
    );
  },

  /** Set expended message, note we rely on object reference comparison here */
  expandMessage: function(message) {
    this.setState({expandedMessage: message});
  },

  /** Render a listening error */
  renderListeningError: function() {
    return (
      <bs.Alert bsStyle="danger" onDismiss={this.dismissListeningError}>
        <strong>Listening Error,</strong>&nbsp;
        {this.state.listeningError.message}
      </bs.Alert>
    );
  },

  /** Dismiss a listening error, basically reset error state */
  dismissListeningError: function() {
    this.setState({listeningError: undefined});
  }
});

// Export PulseInspector
module.exports = PulseInspector;
