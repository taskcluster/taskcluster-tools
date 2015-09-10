var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');
var _               = require('lodash');
var JSONInspector   = require('react-json-inspector');
var slugid          = require('slugid');


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
var MessageRow = React.createClass({
  /** Only update when strictly necessary */
  shouldComponentUpdate: function(nextProps) {
    // Just compare the _idForInspector
    if (this.props.message._idForInspector !==
        nextProps.message._idForInspector) {
      return true;
    }
    if (this.props.expanded !== nextProps.expanded) {
      return true;
    }
    return false;
  },

  /** Render a message row*/
  render: function() {
    var message         = this.props.message;
    var hasCustomRoutes = (message.routes.length > 0);
    if (!this.props.expanded) {
      return (
        <tr onClick={this.handleClick}
            className="pulse-inspector-unexpanded-message">
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
                      message.routes.map(function(route, index) {
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
      </tr>
    );
  },

  /** handleClick */
  handleClick: function() {
    // Do this indirectly so we don't have to render if the event handler
    // changes
    this.props.onClick();
  }
});



var PulseInspector = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createWebListenerMixin({
      reloadOnKeys:   ['bindings', 'doListen']
    }),
    utils.createLocationHashMixin({
      keys:           ['bindings'],
      type:           'json'
    })
  ],

  getDefaultProps: function() {
    return {
      hashIndex:        0
    };
  },

  /** Create initial state */
  getInitialState: function() {
    return {
      doListen:         false,    // Do start listening
      bindings:         [],       // List of bindings
      messages:         [],       // List of messages received
      expandedMessage:  null,     // _idForInspector of current message
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
            This tool lets you listen to Pulse messages from any exchange and
            routing key.  When messages are received you can inspect the
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
    var downloadUrl = "data:application/json;base64," + btoa(JSON.stringify(
      this.state.messages.map(function(message) {
        // We shouldn't expose _idForInspector as it's made up here!
        return _.pick(message, 'exchange', 'routingKey', 'payload');
      }),
      null,
      2
    ));
    this.refs.downloadLink.getDOMNode().href = downloadUrl;
  },

  /** Clear all bindings */
  clearBindings: function() {
    this.setState({bindings: [], doListen: false});
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
                             onClick={this.dontListen}>
                    <bs.Glyphicon glyph="stop"/>&nbsp;
                    Stop Listening
                  </bs.Button>
                ) : (
                  <bs.Button bsStyle="success"
                             onClick={this.doListen}
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
    var binding = {
      exchange:           this.refs.exchange.getValue(),
      routingKeyPattern:  this.refs.routingKeyPattern.getValue()
    };
    this.setState({bindings: this.state.bindings.concat([binding])});
  },

  dontListen: function() {
    this.setState({doListen: false});
  },

  doListen: function() {
    this.setState({doListen: true});
  },

  /** return bindings for WebListenerMixin */
  bindings: function() {
    if (!this.state.doListen) {
      return [];
    }
    return this.state.bindings;
  },


  /** Handle message from WebListener, sent by TaskClusterMixing */
  handleMessage: function(message) {
    message._idForInspector = slugid.nice();
    this.setState({messages: [message].concat(this.state.messages)});
  },

  /** Render table of messages */
  renderMessages: function() {
    var expandedMsgId = this.state.expandedMessage;
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
            this.state.messages.map(function(message) {
              var msgId       = message._idForInspector;
              var expanded    = (msgId === expandedMsgId);
              return <MessageRow
                        key={msgId}
                        expanded={expanded}
                        message={message}
                        onClick={this.expandMessage.bind(this, msgId)}/>
            }, this)
          }
        </tbody>
      </bs.Table>
    );
  },

  /** Set expended message, note we rely on object reference comparison here */
  expandMessage: function(idForInspector) {
    this.setState({expandedMessage: idForInspector});
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
    if (!this.state.listening) {
      this.setState({doListen: false});
    }
  }
});

// Export PulseInspector
module.exports = PulseInspector;
