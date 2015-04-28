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
    buttonSize:     React.PropTypes.string.isRequired,
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

  getInitialState: function() {
    return {
      executing:        false,
      resultLoaded:     false,
      resultError:      undefined,
      result:           undefined
    };
  },

  render: function() {
    return (
      <bs.ModalTrigger modal={this.renderDialog()} ref="modalTrigger">
        <bs.Button bsSize={this.props.buttonSize}
                   bsStyle={this.props.buttonStyle}
                   disabled={this.props.disabled}>
          <bs.Glyphicon glyph={this.props.glyph}/>&nbsp;
          <span>{this.props.label}</span>&nbsp;
        </bs.Button>
      </bs.ModalTrigger>
    );
  },

  renderDialog: function() {
    return (
      <bs.Modal bsStyle="primary" title={this.props.label}>
        <div className="modal-body">
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
        </div>
        <div className="modal-footer">
          <bs.Button
              onClick={this.executeAction}
              bsStyle={this.props.buttonStyle}
              disabled={this.state.executing && !this.state.resultLoaded}>
            <bs.Glyphicon glyph={this.props.glyph}/>&nbsp;
            <span>{this.props.label}</span>
          </bs.Button>
          <bs.Button onClick={this.closeDialog} bsStyle="default">
            <bs.Glyphicon glyph="remove"/>&nbsp;
            Close
          </bs.Button>
        </div>
      </bs.Modal>
    );
  },

  closeDialog: function() {
    this.refs.modalTrigger.hide();
  },

  /** Execute asynchronous action */
  executeAction: function() {
    this.loadState({
      executing:    true,
      result:       this.props.action()
    });
  }
});

// Export ConfirmAction
module.exports = ConfirmAction;
