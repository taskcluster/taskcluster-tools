import React from 'react';
import { string, bool } from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { FontIcon, ListItem, Subheader } from 'react-md';

export default class NavItemLink extends React.PureComponent {
  createRoute = ({ key, props }) => (
    <Route key={key} path={props.to} exact={props.exact}>
      {({ match }) =>
        props.to
          ? this.renderLinkItem(props, match)
          : this.renderItem(props, match)}
    </Route>
  );

  renderLinkItem({ to, icon, primaryText, ...props }, match) {
    return (
      <ListItem
        {...props}
        component={Link}
        to={to}
        active={!!match}
        leftIcon={<FontIcon>{icon}</FontIcon>}
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
      const nestedItems = this.props.nestedItems.map(this.createRoute);

      return (
        <ListItem
          leftIcon={<FontIcon>{this.props.icon}</FontIcon>}
          primaryText={this.props.primaryText}
          nestedItems={nestedItems}
        />
      );
    }

    return this.props.to
      ? this.renderLinkItem(this.props)
      : this.renderItem(this.props);
  }
}

NavItemLink.propTypes = {
  primaryText: string.isRequired,
  icon: string.isRequired,
  header: bool,
  to: string,
  exact: bool
};
