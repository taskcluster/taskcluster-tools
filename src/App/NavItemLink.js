import React from 'react';
import { string, bool } from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { FontIcon, ListItem, Subheader } from 'react-md';

export default class NavItemLink extends React.PureComponent {
  createRoute = item => (
    <Route path={item.to} exact={item.exact}>
      {({ match }) =>
        item.to
          ? this.renderLinkItem(item, match)
          : this.renderItem(item, match)}
    </Route>
  );

  renderLinkItem({ to, icon, primaryText, ...props }, match) {
    return (
      <ListItem
        component={Link}
        to={to}
        active={!!match}
        leftIcon={<FontIcon>{icon || props.leftIcon}</FontIcon>}
        primaryText={primaryText}
      />
    );
  }

  renderItem({ icon, ...props }) {
    return <ListItem {...props} leftIcon={<FontIcon>{icon}</FontIcon>} />;
  }

  render() {
    if (this.props.header) {
      return <Subheader inset primaryText={this.props.primaryText} />;
    }

    if (this.props.nestedItems) {
      const nestedItems = this.props.nestedItems.map(item => (
        <span key={item.key}>{this.createRoute(item)}</span>
      ));

      return (
        <ListItem
          leftIcon={<FontIcon>{this.props.icon}</FontIcon>}
          primaryText={this.props.primaryText}
          nestedItems={nestedItems}
        />
      );
    }

    return this.props.to
      ? this.createRoute(this.props)
      : this.renderItem(this.props);
  }
}

NavItemLink.propTypes = {
  primaryText: string.isRequired,
  icon: string,
  header: bool,
  to: string,
  exact: bool
};
