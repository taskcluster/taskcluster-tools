var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../utils');

/** Button with an associated confirm dialog */
var ConfirmAction = React.createClass({
  mixins: [
    // We use loadState to execute the action asynchronously
    utils.createTaskClusterMixin()
  ],

  propTypes: {
    // Button size, style, glyph and disabled
    buttonSize:     React.PropTypes.string,
    buttonStyle:    React.PropTypes.string.isRequired,
    disabled:       React.PropTypes.bool.isRequired,
    glyph:          React.PropTypes.string.isRequired,
    label:          React.PropTypes.string.isRequired,
    // Text explaining action and success text for successful action
    children:       React.PropTypes.node.isRequired,
    success:        React.PropTypes.string.isRequired,
    // Function executing action, returns promise
    action:         React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      disabled: false
    };
  },

  getInitialState() {
    return {
      showDialog:       false,
      executing:        false,
      resultLoaded:     false,
      resultError:      undefined,
      result:           undefined
    };
  },

  render() {
    return (
      <bs.Button bsSize={this.props.buttonSize}
                 bsStyle={this.props.buttonStyle}
                 disabled={this.props.disabled}
                 onClick={this.openDialog}>
        <bs.Glyphicon glyph={this.props.glyph}/>&nbsp;
        <span>{this.props.label}</span>&nbsp;
        {this.renderDialog()}
      </bs.Button>
    );
  },

  renderDialog() {
    return (
      <bs.Modal bsStyle="primary"
        show={this.state.showDialog}
        onHide={this.closeDialog}>
        <bs.Modal.Header closeButton>
          {this.props.label}
        </bs.Modal.Header>
        <bs.Modal.Body>
          <span>{this.props.children}</span>
          {
            this.state.executing ? (
              <span>
                <hr/>
                <h4>Status</h4>
                <span>
                  {this.renderWaitFor('result') || this.props.success}
                </span>
              </span>
            ) : undefined
          }
        </bs.Modal.Body>
        <bs.Modal.Footer>
          {
            !(this.state.executing || this.state.result) ? (
              <bs.Button
                  onClick={this.executeAction}
                  bsStyle={this.props.buttonStyle}
                  hidden={this.state.result}>
                <bs.Glyphicon glyph={this.props.glyph}/>&nbsp;
                <span>{this.props.label}</span>
              </bs.Button>
            ) : undefined
          }
          <bs.Button onClick={this.closeDialog} bsStyle="default">
            <bs.Glyphicon glyph="remove"/>&nbsp;
            Close
          </bs.Button>
        </bs.Modal.Footer>
      </bs.Modal>
    );
  },

  openDialog() {
    this.setState({showDialog: true});
  },

  closeDialog() {
    this.setState(this.getInitialState());
  },

  /** Execute asynchronous action */
  executeAction() {
    this.loadState({
      executing:    true,
      result:       (async () => {
        let result = await this.props.action();
        this.setState({ executing: false });
        return result;
      })()
    });
  }
});

// Export ConfirmAction
module.exports = ConfirmAction;
