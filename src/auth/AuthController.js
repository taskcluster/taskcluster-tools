import React from 'react';
import PropsRoute from '../components/PropsRoute';
import UserSession from './UserSession';

import Login from '../views/Login';
import Auth0Login from '../views/Auth0Login';
import DevelopmentLogin from '../views/DevelopmentLogin';
import ManualLogin from '../views/ManualLogin';

import OktaLoginMenuItem from './OktaLoginMenuItem';
import Auth0LoginMenuItem from './Auth0LoginMenuItem';
import DevelopmentLoginMenuItem from './DevelopmentLoginMenuItem';
import EmailLoginMenuItem from './EmailLoginMenuItem';
import ManualLoginMenuItem from './ManualLoginMenuItem';

const canSignInUsing = method => process.env.SIGN_IN_METHODS.includes(method);

/**
 * Controller for authentication-related pieces of the site.
 *
 * This encompasses knowledge of which authentication mechanisms are enabled, including credentials menu
 * items, ongoing expiration monitoring, and any additional required UI.  It also handles synchronizing
 * sign-in status across tabs.
 */
export default class AuthController {
  constructor() {
    this.userSessionChangedCallbacks = [];

    window.addEventListener('storage', ({ storageArea, key }) => {
      if (storageArea === localStorage && key === 'userSession') {
        this.loadUserSession();
      }
    });

    this.setUserSession = this.setUserSession.bind(this);
  }

  /**
   * Load the current user session (from localStorage).
   *
   * This will call the onUserSessionChanged callbacks, but does not
   * return the user session.
   */
  loadUserSession() {
    const storedUserSession = localStorage.getItem('userSession');
    const userSession = storedUserSession ?
      UserSession.deserialize(storedUserSession) :
      null;

    this.userSessionChangedCallbacks.forEach(cb => cb(userSession));
  }

  /**
   * Get an array of credentials menu items for the available sign-in
   * methods.
   */
  credentialsMenuItems() {
    return [
      canSignInUsing('okta') && <OktaLoginMenuItem key="okta" />,
      canSignInUsing('auth0') && <Auth0LoginMenuItem key="auth0" />,
      canSignInUsing('development') && <DevelopmentLoginMenuItem key="development" />,
      canSignInUsing('email') && <EmailLoginMenuItem key="email" />,
      canSignInUsing('manual') && <ManualLoginMenuItem key="manual" />
    ].filter(Boolean);
  }

  /**
   * Get an array of routes for authentication-related views
   */
  routes() {
    return [
      canSignInUsing('auth0') &&
        <PropsRoute key="/login/auth0" path="/login/auth0" component={Auth0Login} setUserSession={() => this.setUserSession()} />,
      // this route will go away soon..
      (canSignInUsing('okta') || canSignInUsing('email')) &&
        <PropsRoute key="/login" path="/login" component={Login} setUserSession={() => this.setUserSession()} />,
      canSignInUsing('development') &&
        <PropsRoute key="/login/development" path="/login/development" component={DevelopmentLogin} setUserSession={() => this.setUserSession()} />,
      canSignInUsing('manual') &&
        <PropsRoute key="/login/manual" path="/login/manual" component={ManualLogin} setUserSession={() => this.setUserSession()} />
    ].filter(Boolean);
  }

  /**
   * Set the current user session, or (if null) delete the current user session.
   *
   * This will change the user session in all open windows/tabs, eventually triggering
   * a call to any onSessionChanged callbacks.
   */
  setUserSession(userSession) {
    if (!userSession) {
      localStorage.removeItem('userSession');
    } else {
      localStorage.setItem('userSession', userSession.serialize());
    }

    // localStorage updates do not trigger event listeners on the current window/tab,
    // so invoke it directly
    this.loadUserSession();
  }

  /**
   * Register to get a callback with a UserSession (or null) every time the user session changes.
   * This is typically reflected into state at the top level and handed down as properties.
   */
  onUserSessionChanged(callback) {
    this.userSessionChangedCallbacks.push(callback);
  }
}
