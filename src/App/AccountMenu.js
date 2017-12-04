import React, { Component } from 'react';
import { bool } from 'prop-types';
import { Avatar, FontIcon, AccessibleFakeButton, DropdownMenu } from 'react-md';
import './AccountMenu.scss';

export default class AccountMenu extends Component {
  static propTypes = {
    simplifiedMenu: bool
  };

  render() {
    const { simplifiedMenu } = this.props;

    return (
      <div>
        <div>
          <Avatar
            src="https://2.gravatar.com/avatar/8dc4af17fcbc9d8c1919462680e46c5a?s=400&d=mm"
            role="presentation"
          />
        </div>

        <DropdownMenu
          block={true}
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
          <AccessibleFakeButton className="account-menu">
            <div>Eli Perelman</div>
            <div className="account-menu-email">
              <div>
                <small>eliperelman@mozilla.com</small>
              </div>
              <div>
                <FontIcon>arrow_drop_down</FontIcon>
              </div>
            </div>
          </AccessibleFakeButton>
        </DropdownMenu>
      </div>
    );
  }
}
