import { PureComponent } from 'react';
import { Table, DropdownButton, MenuItem } from 'react-bootstrap';
import { camelCase } from 'change-case';
import moment from 'moment';
import Spinner from '../../components/Spinner';
import Error from '../../components/Error';
import DateView from '../../components/DateView';
import { buttonGroup, columnNoWrap } from './styles.module.css';

export default class AwsProvisionerErrors extends PureComponent {
  state = {
    loading: true,
    error: null,
    recentErrors: null,
    sortBy: null
  };

  componentWillMount() {
    this.loadRecentErrors();
  }

  async loadRecentErrors() {
    try {
      this.setState({
        recentErrors: (await this.props.ec2Manager.getRecentErrors()).errors,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        recentErrors: null,
        loading: false,
        error
      });
    }
  }

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

  renderRecentError(error, key) {
    return (
      <tr key={`recent-error-${key}`}>
        <td className={columnNoWrap}>{error.az}</td>
        <td className={columnNoWrap}>{error.type}</td>
        <td className={columnNoWrap}>{error.instanceType}</td>
        <td className={columnNoWrap}>
          <code>{error.code}</code>
        </td>
        <td className={columnNoWrap}>{error.region}</td>
        <td className={columnNoWrap}>
          <DateView date={error.time} />
        </td>
        <td>{error.message}</td>
      </tr>
    );
  }

  handleSortSelect = sortBy => {
    this.setState({ sortBy });
  };

  render() {
    const { loading, error, recentErrors, sortBy } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    if (!recentErrors || !recentErrors.length) {
      return (
        <div>
          No recent errors in <code>{this.props.provisionerId}</code>
        </div>
      );
    }

    return (
      <div>
        <h4>Recent Errors</h4>
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
          <tbody>
            {recentErrors &&
              recentErrors.sort(this.sort).map(this.renderRecentError)}
          </tbody>
        </Table>
      </div>
    );
  }
}
