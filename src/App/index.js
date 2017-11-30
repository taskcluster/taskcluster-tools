import React, { Component } from 'react';
import {
  BrowserRouter,
  Route,
  Switch,
  withRouter,
  Link
} from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Autocomplete, Button, FontIcon, NavigationDrawer } from 'react-md';
import NavItemLink from './NavItemLink';
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
        navItems={menuItems.map((itemProps, key) => (
          <NavItemLink {...itemProps} {...props} key={`nav-${key}`} />
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
            <Autocomplete
              id="documentation-search"
              placeholder="Search"
              inputClassName={
                'search__input search__input--visible search__input--active'
              }
              filter={null}
              data={[]}
              total={0}
              style={{ position: 'absolute', width: 80, right: 250 }}
              leftIcon={<FontIcon>search</FontIcon>}
              listClassName="search__results"
              value={'e9qa7fJkS1WjwU3w1Q4w7A'}
              sameWidth={false}
              simplifiedMenu={false}
              minBottom={20}
              fillViewportWidth={false}
              fillViewportHeight={false}
            />
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
