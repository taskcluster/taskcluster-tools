import { PureComponent } from 'react';
import { bool, func, node, string } from 'prop-types';
import { MenuItem, Modal, Button } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import Error from '../Error';

export default class ModalItem extends PureComponent {
  static propTypes = {
    className: string,
    disabled: bool,
    submitDisabled: bool,
    onSubmit: func,
    onComplete: func,
    button: bool,
    body: node.isRequired,
    bsStyle: string,
    bsSize: string,
    modalSize: string
  };

  static defaultProps = {
    className: null,
    disabled: false,
    submitDisabled: false,
    button: false,
    bsStyle: 'primary'
  };

  constructor(props) {
    super(props);
    this.state = {
      show: false,
      executing: false,
      error: null
    };
  }

  handleOpen = e => {
    if (e) {
      e.preventDefault();
    }

    this.setState({ show: true });
  };

  handleClose = () => this.setState({ show: false, error: null });

  handleSubmit = () => {
    this.setState({ executing: true }, async () => {
      try {
        const result = await (this.props.onSubmit && this.props.onSubmit());

        this.setState({ executing: false, show: false }, () => {
          if (this.props.onComplete) {
            this.props.onComplete(result);
          }
        });
      } catch (err) {
        this.setState({
          error: err,
          executing: false
        });
      }
    });
  };

  render() {
    const {
      submitDisabled,
      disabled,
      body,
      children,
      button,
      bsStyle,
      bsSize,
      style,
      modalSize
    } = this.props;
    const { show, executing, error } = this.state;
    const modal = (
      <Modal show={show} onHide={this.handleClose} bsSize={modalSize}>
        <Modal.Header>
          <Modal.Title>{children}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Error error={error} />}
          {body}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleClose}>Cancel</Button>
          <Button
            onClick={this.handleSubmit}
            disabled={executing || submitDisabled}
            bsStyle={bsStyle}>
            {executing ? <Icon name="spinner" pulse /> : children}
          </Button>
        </Modal.Footer>
      </Modal>
    );

    return button ? (
      <Button
        className={this.props.className}
        onClick={this.handleOpen}
        disabled={disabled}
        bsStyle={bsStyle}
        style={style}
        bsSize={bsSize}>
        {children}
        {modal}
      </Button>
    ) : (
      <MenuItem onSelect={this.handleOpen} disabled={disabled}>
        {children}
        {modal}
      </MenuItem>
    );
  }
}
