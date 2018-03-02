import { PureComponent } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { sentenceCase } from 'change-case';
import { string, func, array } from 'prop-types';

export default class OrderByDropdown extends PureComponent {
  static propTypes = {
    orderBy: string,
    onSelect: func,
    orderableProperties: array.isRequired
  };

  render() {
    return (
      <DropdownButton
        bsSize="sm"
        title={`Order by: ${
          this.props.orderBy ? sentenceCase(this.props.orderBy) : 'None'
        }`}
        id="order-by-worker-types-dropdown"
        onSelect={this.props.onSelect}>
        <MenuItem eventKey="None">None</MenuItem>
        <MenuItem divider />
        {this.props.orderableProperties.map(prop => (
          <MenuItem
            eventKey={prop}
            key={`order-by-worker-types-dropdown-${prop}`}>
            {sentenceCase(prop)}
          </MenuItem>
        ))}
      </DropdownButton>
    );
  }
}
