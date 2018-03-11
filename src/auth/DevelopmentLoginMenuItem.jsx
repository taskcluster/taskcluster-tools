import { PureComponent } from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

export default class DevelopmentLoginMenuItem extends PureComponent {
  handleSelect() {
    const query = new URLSearchParams();

    query.set('callback_url', new URL('/login/development', window.location));
    query.set('scope', 'xyz'); // defeat the default '*' and require user to enter desired scopes
    query.set('name', 'tools-devel');
    query.set(
      'description',
      'Temporary client for developing and testing taskcluster-tools'
    );
    window.open(
      `https://tools.taskcluster.net/auth/clients/new?${query.toString()}`,
      '_blank'
    );
  }

  render() {
    const tooltip = (
      <Tooltip id="development-signin">
        When running tools on a development server, use this option to get
        credentials from the production tools.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="bottom" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.handleSelect}>
          <Glyphicon glyph="console" /> Development Sign-In
        </NavItem>
      </OverlayTrigger>
    );
  }
}
