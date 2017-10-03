import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Grid } from 'react-bootstrap';
import PropsRoute from '../components/PropsRoute';
import Navigation from '../components/Navigation';
import NotFound from '../components/NotFound';
import { loadable } from '../utils';
import './styles.css';
import iconUrl from '../taskcluster.png';
import Spinner from '../components/Spinner';
import AuthController from '../auth/AuthController';

const Home = loadable(() =>
  import(/* webpackChunkName: 'Home' */ '../views/Home')
);
const CredentialsManager = loadable(() =>
  import(/* webpackChunkName: 'CredentialsManager' */ '../views/CredentialsManager')
);
const Auth0Login = loadable(() =>
  import(/* webpackChunkName: 'Auth0Login' */ '../views/Auth0Login')
);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.authController = new AuthController();
    this.state = {
      userSession: null,
      authReady: false
    };
  }

  componentWillMount() {
    this.authController.onUserSessionChanged(this.handleUserSessionChanged);

    // we do not want to automatically load a user session on the login views; this is
    // a hack until they get an entry point of their own with no UI.
    if (!window.location.pathname.startsWith('/login')) {
      this.authController.loadUserSession();
    } else {
      this.setState({ authReady: true });
    }
  }

  handleUserSessionChanged = userSession => {
    // Consider auth "ready" when we have no userSession, a userSession with no
    // renewAfter, or a renewAfter that is not in the past.  Once auth is
    // ready, it never becomes non-ready again.
    const authReady =
      this.state.authReady ||
      !userSession ||
      !userSession.renewAfter ||
      new Date(userSession.renewAfter) > new Date();
    this.setState({ userSession, authReady });
  };

  render() {
    const { authReady, userSession } = this.state;
    const { authController } = this;

    return (
      <BrowserRouter>
        <div>
          <Helmet>
            <link rel="shortcut icon" type="image/png" href={iconUrl} />
          </Helmet>
          <PropsRoute
            component={Navigation}
            userSession={userSession}
            authController={authController}
          />
          <Grid fluid id="container">
            {authReady ? (
              <Switch>
                <PropsRoute
                  path="/"
                  exact={true}
                  component={Home}
                  userSession={userSession}
                />
                <PropsRoute
                  path="/credentials"
                  component={CredentialsManager}
                  userSession={userSession}
                />
                {authController.canSignInUsing('auth0') && (
                  <PropsRoute
                    path="/login/auth0"
                    component={Auth0Login}
                    setUserSession={authController.setUserSession}
                  />
                )}
                <Route component={NotFound} />
              </Switch>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Spinner />
                <br />
                Authenticating...
              </div>
            )}
          </Grid>
        </div>
      </BrowserRouter>
    );
  }
}
