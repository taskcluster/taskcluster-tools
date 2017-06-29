import React from 'react';
import { array } from 'prop-types';
import { NavDropdown, MenuItem, NavItem } from 'react-bootstrap';

export default class ArtifactsMenu extends React.PureComponent {
  static propTypes = {
    artifacts: array
  };

  render() {
    const { artifacts } = this.props;

    if (!artifacts || !artifacts.length) {
      return <NavItem disabled>No artifacts</NavItem>;
    }

    return (
      <NavDropdown title="Artifacts" id="artifacts-dropdown">
        {artifacts.map(({ name, icon, url }, index) => (
          <MenuItem href={url} target="_blank" rel="noopener noreferrer" key={`runs-menu-artifacts-${index}`}>
            <i className={`fa fa-${icon}`} style={{ marginRight: 5 }} /> {name}
          </MenuItem>
        ))}
      </NavDropdown>
    );
  }
}
