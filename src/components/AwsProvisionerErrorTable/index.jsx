import { PureComponent } from 'react';
import { arrayOf, object } from 'prop-types';
import { Table, DropdownButton, MenuItem } from 'react-bootstrap';
import { camelCase } from 'change-case';
import moment from 'moment';
import DateView from '../../components/DateView';
import { buttonGroup, columnNoWrap } from './styles.module.css';

export default class AwsProvisionerErrorTable extends PureComponent {
  static propTypes = {
    errorData: arrayOf(object).isRequired
  };

  state = {
    sortBy: null
  };

  sort = (a, b) => {
    const { sortBy } = this.state;

    if (!sortBy || sortBy === 'None') {
      return a;
    }

    if (sortBy === 'Time') {
      return moment(a.time).diff(moment(b.time)) < 0 ? 1 : -1;
    }

    return a[camelCase(sortBy)].localeCompare(b[camelCase(sortBy)]);
  };

  renderRow(item) {
    return (
      <tr key={`${item.type}:${item.workerType}:${item.time}`}>
        <td className={columnNoWrap}>{item.az}</td>
        <td className={columnNoWrap}>{item.type}</td>
        <td className={columnNoWrap}>{item.instanceType}</td>
        <td className={columnNoWrap}>
          <code>{item.code}</code>
        </td>
        <td className={columnNoWrap}>{item.region}</td>
        <td className={columnNoWrap}>
          <DateView date={item.time} />
        </td>
        <td>{item.message}</td>
      </tr>
    );
  }

  handleSortSelect = sortBy => {
    this.setState({ sortBy });
  };

  render() {
    const { errorData } = this.props;
    const { sortBy } = this.state;

    if (!errorData || !errorData.length) {
      return <div>Errors not available</div>;
    }

    return (
      <div>
        <div className={buttonGroup}>
          <DropdownButton
            id="sort-error-table-dropdown"
            bsSize="small"
            title={`Sort by: ${sortBy || 'None'}`}
            onSelect={this.handleSortSelect}>
            <MenuItem eventKey="None">None</MenuItem>
            <MenuItem divider />
            <MenuItem eventKey="AZ">AZ</MenuItem>
            <MenuItem eventKey="Type">Type</MenuItem>
            <MenuItem eventKey="Instance Type">Instance Type</MenuItem>
            <MenuItem eventKey="Code">Code</MenuItem>
            <MenuItem eventKey="Region">Region</MenuItem>
            <MenuItem eventKey="Time">Time</MenuItem>
          </DropdownButton>
        </div>
        <Table hover responsive condensed>
          <thead>
            <tr>
              <th>AZ</th>
              <th>Type</th>
              <th>Instance Type</th>
              <th>Code</th>
              <th>Region</th>
              <th>Time</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>{errorData.sort(this.sort).map(this.renderRow)}</tbody>
        </Table>
      </div>
    );
  }
}
