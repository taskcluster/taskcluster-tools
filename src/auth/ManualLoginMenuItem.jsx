import { PureComponent } from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

export default class ManualLoginMenuItem extends PureComponent {
  handleSelect() {
    // open the login view in a new tab/window
    window.open(new URL('/login/manual', window.location), '_blank');
  }

  render() {
    const tooltip = (
      <Tooltip id="manual-signin">
        Use this option to provide a clientId, accessToken, and certificate
        manually.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="bottom" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.handleSelect}>
          <Glyphicon glyph="paste" /> Sign In Manually
        </NavItem>
      </OverlayTrigger>
    );
  }
}
