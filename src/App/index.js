import React, { Component } from 'react';
import {
  Autocomplete,
  Button,
  Cell,
  FontIcon,
  NavigationDrawer
} from 'react-md';
import FontLoader from '../components/FontLoader';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import menuItems from './menuItems';
import './app.scss';

export default class App extends Component {
  constructor() {
    super();

    // Update the items so they have an onClick handler to change the current page
    this.navItems = menuItems.map(item => {
      if (item.divider) {
        return item;
      }

      return {
        ...item,
        onClick: () => this.setPage(item.key, item.primaryText)
      };
    });

    this.state = {
      key: menuItems[0].key,
      page: menuItems[0].primaryText
    };
  }

  setPage = (key, page) => {
    this.navItems = this.navItems.map(item => {
      if (item.divider) {
        return item;
      }

      return { ...item, active: item.key === key };
    });

    this.setState({ key, page });
  };

  handleActionClick = () => {
    if (this.state.searching) {
      this.setState({ value: '' });
    } else {
      this.setState({ searching: true });
    }
  };

  render() {
    const { page } = this.state;

    return (
      <div>
        <FontLoader />
        <NavigationDrawer
          navItems={this.navItems}
          mobileDrawerType={NavigationDrawer.DrawerTypes.TEMPORARY}
          tabletDrawerType={NavigationDrawer.DrawerTypes.PERSISTENT}
          desktopDrawerType={NavigationDrawer.DrawerTypes.CLIPPED}
          drawerHeaderChildren={
            <div style={{ margin: '12px 8px' }}>
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
            <div>
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
            </div>
          }
          contentId="main-content"
          persistentIcon={<FontIcon>menu</FontIcon>}
          contentClassName="md-grid">
          <Cell size={12}>{page}</Cell>
        </NavigationDrawer>
      </div>
    );
  }
}
