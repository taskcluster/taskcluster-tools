import { PureComponent } from 'react';
import {
  Row,
  Col,
  ButtonToolbar,
  Button,
  Glyphicon,
  Table,
  Alert,
  FormGroup,
  FormControl,
  ControlLabel
} from 'react-bootstrap';
import { WebListener } from 'taskcluster-client-web';
import { nice } from 'slugid';
import { pick } from 'ramda';
import { parse, stringify } from 'qs';
import MessageRow from './MessageRow';
import HelmetTitle from '../../components/HelmetTitle';

export default class PulseInspector extends PureComponent {
  static defaultProps = {
    hashIndex: 0
  };

  constructor(props) {
    super(props);

    this.state = {
      bindings: [],
      messages: [],
      expandedMessage: null,
      listening: false,
      listeningError: null,
      exchangeValue: '',
      downloadLink: 'data:application/json;base64,IkJyb3dzZXIgSXNzdWUi',
      routingKeyPatternValue: '#'
    };
  }

  componentWillMount() {
    const bindings = this.getBindingsFromProps(this.props);

    this.setState({
      bindings,
      listening: false
    });

    this.createListener(bindings);
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener.close();
      this.listener = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      const bindings = this.getBindingsFromProps(nextProps);

      this.setState({ bindings, listening: false });
      this.createListener(bindings);
    }
  }

  getBindingsFromProps(props) {
    const query = parse(props.location.search.slice(1));

    return query.bindings ? Object.values(query.bindings) : [];
  }

  createListener(bindings) {
    if (this.listener) {
      this.listener.close();
      this.listener = null;
    }

    if (!bindings || !bindings.length) {
      return;
    }

    try {
      const listener = new WebListener();

      bindings.map(binding => listener.bind(binding));

      listener.on('message', this.handleListenerMessage);

      this.listener = listener;

      return listener;
    } catch (err) {
      this.setState({ listeningError: err });
    }
  }

  handleListenerMessage = message => {
    const messages = [
      { ...message, _idForInspector: nice() },
      ...this.state.messages
    ];
    const params = btoa(
      JSON.stringify(
        messages.map(pick(['exchange', 'routingKey', 'payload'])),
        null,
        2
      )
    );

    this.setState({
      messages,
      downloadLink: `data:application/json;base64,${params}`
    });
  };

  handleClearBindings = () => {
    this.props.history.replace('/pulse-inspector');
  };

  handleUpdateExchangeValue = e =>
    this.setState({ exchangeValue: e.target.value });

  handleUpdateRoutingKeyPatternValue = e =>
    this.setState({ routingKeyPatternValue: e.target.value });

  handleAddBinding = () => {
    const { exchangeValue, routingKeyPatternValue } = this.state;
    const bindings = this.state.bindings.concat([
      {
        exchange: exchangeValue,
        routingKeyPattern: routingKeyPatternValue
      }
    ]);

    this.props.history.replace(`/pulse-inspector?${stringify({ bindings })}`);
  };

  handleStopListening = () => {
    this.setState({ listening: false });
    this.listener.close();
  };

  handleStartListening = () => {
    this.setState({ listening: true });
    this.listener.connect();
  };

  /** Set expanded message, note we rely on object reference comparison here */
  handleExpandMessage = idForInspector =>
    this.setState({ expandedMessage: idForInspector });

  handleDismissListeningError = () => this.setState({ listeningError: null });

  renderBindings() {
    if (!this.state.bindings.length) {
      return (
        <p>
          <em>Please create some bindings...</em>
        </p>
      );
    }

    return (
      <ul>
        {this.state.bindings.map((binding, index) => (
          <li key={index}>
            <code>{binding.exchange}</code> with{' '}
            <code>{binding.routingKeyPattern}</code>
          </li>
        ))}
      </ul>
    );
  }

  renderForm() {
    const { exchangeValue, routingKeyPatternValue } = this.state;

    return (
      <div className="form">
        <FormGroup>
          <ControlLabel>Pulse Exchange</ControlLabel>
          <div>
            <FormControl
              value={exchangeValue}
              onChange={this.handleUpdateExchangeValue}
              type="text"
              placeholder="exchange/<username>/some-exchange-name"
            />
          </div>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Routing Key Pattern</ControlLabel>
          <div>
            <FormControl
              value={routingKeyPatternValue}
              onChange={this.handleUpdateRoutingKeyPatternValue}
              type="text"
              placeholder="#.some-interesting-key.#"
            />
          </div>
        </FormGroup>
        <div className="form-group">
          <div>
            <ButtonToolbar>
              <Button
                bsStyle="primary"
                onClick={this.handleAddBinding}
                disabled={this.state.listening}>
                <Glyphicon glyph="plus" /> Add binding
              </Button>
              {this.state.listening ? (
                <Button bsStyle="danger" onClick={this.handleStopListening}>
                  <Glyphicon glyph="stop" /> Stop Listening
                </Button>
              ) : (
                <Button
                  bsStyle="success"
                  onClick={this.handleStartListening}
                  disabled={this.state.listening}>
                  <Glyphicon glyph="play" /> Start Listening
                </Button>
              )}
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  }

  renderListeningError() {
    return (
      <Alert bsStyle="danger" onDismiss={this.handleDismissListeningError}>
        <strong>Listening Error:</strong> {this.state.listeningError.message}
      </Alert>
    );
  }

  renderMessages() {
    const expandedMsgId = this.state.expandedMessage;

    return (
      <Table condensed hover>
        <thead>
          <tr>
            <th>Exchange</th>
            <th>Routing Key</th>
          </tr>
        </thead>
        <tbody>
          {this.state.messages.map(message => {
            const msgId = message._idForInspector; // eslint-disable-line no-underscore-dangle
            const expanded = msgId === expandedMsgId;

            return (
              <MessageRow
                key={msgId}
                expanded={expanded}
                message={message}
                onClick={() => this.handleExpandMessage(msgId)}
              />
            );
          })}
        </tbody>
      </Table>
    );
  }

  render() {
    return (
      <Row>
        <HelmetTitle title="Pulse Inspector" />
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
            </a>. Notice that all exchanges from Taskcluster is formally
            documented on{' '}
            <a href="https://docs.taskcluster.net">docs.taskcluster.net</a>.
          </p>
          <hr />
          {this.renderForm()}
          {this.state.listeningError ? this.renderListeningError() : null}
          <hr />
          <ButtonToolbar className="pull-right">
            <Button
              bsSize="sm"
              bsStyle="danger"
              onClick={this.handleClearBindings}
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
              href={this.state.downloadLink}
              download="pulse-messages.json"
              disabled={this.state.messages.length === 0}>
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
  }
}
