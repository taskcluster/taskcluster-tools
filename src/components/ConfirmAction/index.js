import React from 'react';
import { string, bool, node, func } from 'prop-types';
import { Button, Glyphicon, MenuItem, Modal } from 'react-bootstrap';
import Error from '../Error';

export default class ConfirmAction extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      executing: false,
      resultLoaded: false,
      resultError: null,
      result: null
    };

    this.openDialog = this.openDialog.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }

  openDialog() {
    this.setState({ show: true });
  }

  handleHide() {
    this.setState({ show: false });
  }

  async executeAction() {
    this.setState({ executing: true, error: null });

    try {
      this.setState({
        executing: false,
        result: await this.props.action()
      });
    } catch (err) {
      this.setState({
        executing: false,
        error: err,
        result: null
      });
    }
  }

  render() {
    const {
      buttonSize,
      buttonStyle,
      children,
      menu,
      disabled,
      glyph,
      title,
      success
    } = this.props;
    const { error, executing, result } = this.state;
    const Wrapper = menu ? MenuItem : Button;
    const props = {
      disabled,
      onClick: this.openDialog
    };

    if (!menu) {
      props.bsStyle = buttonStyle;
      props.bsSize = buttonSize;
    }

    return (
      <Wrapper {...props}>
        <Modal
          bsStyle="primary"
          show={this.state.show}
          onHide={this.handleHide}>
          <Modal.Header closeButton={true}>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <span>{children}</span>
            {executing && (
              <div>
                <hr />
                <h4>Status</h4>
                <span>
                  {error && <Error error={error} />}
                  {result && success}
                </span>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {!(executing || result) && (
              <Button
                bsStyle={buttonStyle}
                hidden={result}
                onClick={this.executeAction}>
                <Glyphicon glyph={glyph} /> <span>{title}</span>
              </Button>
            )}
            <Button onClick={this.handleHide} bsStyle="default">
              <Glyphicon glyph="remove" /> Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Wrapper>
    );
  }
}

ConfirmAction.propTypes = {
  buttonSize: string,
  buttonStyle: string,
  disabled: bool.isRequired,
  glyph: string.isRequired,
  label: string.isRequired,
  // Text explaining action and success text for successful action
  children: node.isRequired,
  success: string.isRequired,
  // Function executing action, returns promise
  action: func.isRequired,
  menu: bool
};

ConfirmAction.defaultProps = {
  disabled: false,
  menu: false
};
