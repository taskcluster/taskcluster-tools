import { PureComponent } from 'react';
import { Breadcrumb as Nav } from 'react-bootstrap';
import { arrayOf, string, object, oneOfType } from 'prop-types';

export default class Breadcrumb extends PureComponent {
  isActive = title => {
    if (!this.props.active) {
      return this.props.navList.slice(-1) === title;
    }

    return typeof this.props.active === 'string'
      ? this.props.active === title
      : this.props.active.includes(title);
  };

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
  active: oneOfType([string, arrayOf(string)]),
  navList: arrayOf(object).isRequired
};
