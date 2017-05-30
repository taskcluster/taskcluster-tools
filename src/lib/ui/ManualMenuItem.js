import React, { Component } from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

export default class ManualMenuItem extends Component {
  render() {
    const tooltip = (
      <Tooltip id="manual-signin">
        Use this option to provide a clientId, accessToken, and certificate manually.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.props.showManualModal}>
          <Glyphicon glyph="paste" /> Sign In Manually
        </NavItem>
      </OverlayTrigger>
    );
  }
}
