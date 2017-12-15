import React, { Component } from 'react';
import {
  BrowserRouter,
  Route,
  Switch,
  withRouter,
  Link
} from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Button, FontIcon, NavigationDrawer } from 'react-md';
import NavItemLink from './NavItemLink';
import GlobalSearch from '../components/GlobalSearch';
import FontLoader from '../components/FontLoader';
import PropsRoute from '../components/PropsRoute';
import NotFound from '../components/NotFound';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import iconUrl from '../images/taskcluster.png';
import menuItems from './menuItems';
import { loadable } from '../utils';
import './app.scss';

const Home = loadable(() =>
  import(/* webpackChunkName: 'Home' */ '../views/Home')
);

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      userSession: null
    };
  }

  handleActionClick = () => {
    if (this.state.searching) {
      this.setState({ value: '' });
    } else {
      this.setState({ searching: true });
    }
  };

  render() {
    const App = withRouter(props => (
      <NavigationDrawer
        navItems={menuItems.map(itemProps => (
          <NavItemLink {...itemProps} {...props} key={itemProps.key} />
        ))}
        mobileDrawerType={NavigationDrawer.DrawerTypes.TEMPORARY}
        tabletDrawerType={NavigationDrawer.DrawerTypes.PERSISTENT}
        desktopDrawerType={NavigationDrawer.DrawerTypes.CLIPPED}
        drawerHeaderChildren={
          <div style={{ margin: '12px 8px', width: '100%' }}>
            <AccountMenu simplifiedMenu={false} />
          </div>
        }
        toolbarActions={
          <div>
            <GlobalSearch />
            <Button icon onClick={this.handleActionClick}>
              feedback
            </Button>
            <Button icon onClick={this.handleActionClick}>
              help_outline
            </Button>
          </div>
        }
        toolbarTitle={
          <Link to="/">
            <Logo />
            <span
              style={{
                letterSpacing: 0,
                fontSize: 24,
                fontFamily: 'FiraSans500',
                color: '#f9f9fa'
              }}>
              &nbsp;&nbsp;Firefox CI
            </span>
          </Link>
        }
        contentId="main-content"
        persistentIcon={<FontIcon>menu</FontIcon>}
        contentClassName="md-grid">
        <div>
          <Helmet>
            <link rel="shortcut icon" type="image/png" href={iconUrl} />
          </Helmet>
          <Switch>
            <PropsRoute path="/" exact={true} component={Home} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </NavigationDrawer>
    ));

    return (
      <div>
        <FontLoader />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </div>
    );
  }
}
