import React from 'react';
import { Breadcrumb as Nav } from 'react-bootstrap';
import { arrayOf, string, object, oneOfType } from 'prop-types';

export default class Breadcrumb extends React.PureComponent {
  isActive = title =>
    typeof this.props.active === 'string'
      ? this.props.active === title
      : this.props.active.includes(title);

  render() {
    return (
      <Nav>
        {this.props.navList.map((entry, key) => (
          <Nav.Item
            key={`breadcrumb-${key}`}
            active={this.isActive(entry.title)}
            href={entry.href}>
            {entry.title}
          </Nav.Item>
        ))}
      </Nav>
    );
  }
}

Breadcrumb.propTypes = {
  active: oneOfType([string, arrayOf(string)]).isRequired,
  navList: arrayOf(object).isRequired
};
