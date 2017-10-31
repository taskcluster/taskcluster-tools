import React, { Component } from 'react';
import { bool } from 'prop-types';
import {
  Avatar,
  FontIcon,
  AccessibleFakeButton,
  IconSeparator,
  DropdownMenu
} from 'react-md';

export default class AccountMenu extends Component {
  static propTypes = {
    simplifiedMenu: bool
  };

  render() {
    const { simplifiedMenu } = this.props;

    return (
      <DropdownMenu
        id={`${!simplifiedMenu ? 'smart-' : ''}avatar-dropdown-menu`}
        menuItems={['Manage credentials', 'Sign out']}
        anchor={{
          x: DropdownMenu.HorizontalAnchors.CENTER,
          y: DropdownMenu.VerticalAnchors.OVERLAP
        }}
        position={DropdownMenu.Positions.TOP_LEFT}
        animationPosition="below"
        sameWidth
        simplifiedMenu={simplifiedMenu}>
        <AccessibleFakeButton
          component={IconSeparator}
          iconBefore
          label={
            <IconSeparator label="Eli Perelman">
              <FontIcon>arrow_drop_down</FontIcon>
            </IconSeparator>
          }>
          <Avatar
            src="https://2.gravatar.com/avatar/8dc4af17fcbc9d8c1919462680e46c5a?s=400&d=mm"
            role="presentation"
          />
        </AccessibleFakeButton>
      </DropdownMenu>
    );
  }
}
