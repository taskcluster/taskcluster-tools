import React from 'react';
import { Popover, Overlay } from 'react-bootstrap';

class CredentialsPopover extends React.PureComponent {
  render() {
    const { message, title, onHide, target } = this.props;

    return (
      <Overlay placement="bottom" show={true} rootClose={true} onHide={onHide} target={() => target}>
        <Popover placement="bottom" id="signin-alert" title={title}>
          {message}
        </Popover>
      </Overlay>
    );
  }
}

export default CredentialsPopover;
