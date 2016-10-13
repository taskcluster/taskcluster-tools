import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';
import { Login } from 'taskcluster-client';
import '../persona';

// This interfaces directly with Persona, then uses the Login service API to convert the resulting
// promise into TaskCluster credentials

export default class extends React.Component {
  static displayName = 'PersonaMenuItem';

  signIn() {
    navigator.id.get(assertion => {
      const port = location.port || location.protocol === 'https:' ? '443' : '80';
      const audience = `${location.protocol}//${location.host}:${port}`;

      if (assertion) {
        const login = new Login();

        login
          .credentialsFromPersonaAssertion({ assertion, audience })
          .then(this.props.setCredentials)
          .catch(err => {
            this.props.showMessage({
              title: 'Sign-In Error',
              body: err.details ? `${err.body.details.code}: ${err.body.details.message}` : err.code
            });
          });
      } else {
        this.props.showMessage({
          title: 'Sign-In Cancelled',
          body: 'Sign-In was cancelled'
        });
      }
    });
  }

  render() {
    const tooltip = (
      <Tooltip id="persona-signin">
        If you are a Mozillian but do not have an LDAP account, sign in with Persona. If you do not
        have a Mozillians profile, set one up now. Get vouched to gain access to additional scopes.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="user"/> Sign In with Persona
        </NavItem>
      </OverlayTrigger>
    );
  }
}
