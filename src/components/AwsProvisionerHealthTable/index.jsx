import { PureComponent } from 'react';
import {
  Table,
  DropdownButton,
  MenuItem,
  Badge,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { snakeCase, camelCase } from 'change-case';
import { isEmpty, defaultTo } from 'ramda';
import { object } from 'prop-types';
import { buttonGroup, columnNoWrap, tooltip } from './styles.module.css';

export default class AwsProvisionerHealthTable extends PureComponent {
  static propTypes = {
    healthData: object.isRequired
  };

  state = { sortBy: null };

  getHealthSummary() {
    const healthSummary = {};
    const { requestHealth, terminationHealth, running } = this.props.healthData;
    const identifier = item => `${item.az}-${item.region}-${item.instanceType}`;
    const or0 = defaultTo(0);

    requestHealth &&
      requestHealth.forEach(item => {
        healthSummary[identifier(item)] = {
          ...healthSummary[identifier(item)],
          ...item
        };
      });
    terminationHealth &&
      terminationHealth.forEach(item => {
        healthSummary[identifier(item)] = {
          ...healthSummary[identifier(item)],
          ...item
        };
      });
    running &&
      running.forEach(item => {
        healthSummary[identifier(item)] = {
          ...healthSummary[identifier(item)],
          ...item
        };
      });

    Object.entries(healthSummary).forEach(([key, item]) => {
      healthSummary[key].healthy =
        or0(item.successful) + or0(item.clean_shutdown) + or0(item.running);
      healthSummary[key].unhealthy =
        or0(item.failed) +
        or0(item.spot_kill) +
        or0(item.insufficient_capacity) +
        or0(item.volume_limit_exceeded) +
        or0(item.missing_ami) +
        or0(item.startup_failed) +
        or0(item.unknown_codes) +
        or0(item.no_code);
    });

    return healthSummary;
  }

  sort = (a, b) => {
    const { sortBy } = this.state;
    // TODO: Remove snake-case logic when API changes to be consistent
    // e.g., https://ec2-manager.taskcluster.net/v1/worker-types/gecko-1-b-linux/health
    const elem1 = a[camelCase(sortBy)] || a[snakeCase(sortBy)];
    const elem2 = b[camelCase(sortBy)] || b[snakeCase(sortBy)];

    if (!sortBy || sortBy === 'None') {
      return a;
    } else if (Number.isInteger(elem1)) {
      const diff = elem1 - elem2;

      if (diff === 0) {
        return 0;
      }

      return diff < 0 ? 1 : -1;
    }

    return elem1.localeCompare(elem2);
  };

  renderRow(item) {
    const or0 = defaultTo(0);
    const identifier = `${item.az}-${item.region}-${item.instanceType}`;
    const healthyTooltip = (
      <Tooltip className={tooltip} id={`${identifier}-healthy`}>
        {`Successful Requests: ${or0(item.successful)}\nClean Shutdown: ${or0(
          item.clean_shutdown
        )}\nRunning: ${or0(item.running)}`}
      </Tooltip>
    );
    const unhealthyTooltip = (
      <Tooltip className={tooltip} id={`${identifier}-unhealthy`}>
        {`Failed Requests: ${or0(item.failed)}\nSpot Kill: ${or0(
          item.spot_kill
        )}\nInsufficient Capacity: ${or0(
          item.insufficient_capacity
        )}\nVolume Limit Exceeded: ${or0(
          item.volume_limit_exceeded
        )}\nMissing AMI: ${item.missing_ami}\nStartup Failed: ${
          item.startup_failed
        }\nUnknown Codes: ${item.unknown_codes}\nNo Codes: ${item.no_code}`}
      </Tooltip>
    );

    return (
      <tr key={identifier}>
        <td className={columnNoWrap}>{item.az}</td>
        <td className={columnNoWrap}>{item.region}</td>
        <td className={columnNoWrap}>{item.instanceType}</td>
        <td className={columnNoWrap}>
          <OverlayTrigger placement="left" overlay={healthyTooltip}>
            <Badge>{item.healthy}</Badge>
          </OverlayTrigger>
        </td>
        <td className={columnNoWrap}>
          <OverlayTrigger placement="left" overlay={unhealthyTooltip}>
            <Badge>{item.unhealthy}</Badge>
          </OverlayTrigger>
        </td>
      </tr>
    );
  }

  handleSortSelect = sortBy => {
    this.setState({ sortBy });
  };

  render() {
    const { sortBy } = this.state;
    const healthSummary = this.getHealthSummary();

    if (isEmpty(healthSummary)) {
      return <div>Health stats not available</div>;
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
            <MenuItem eventKey="Region">Region</MenuItem>
            <MenuItem eventKey="Instance Type">Instance Type</MenuItem>
            <MenuItem eventKey="Healthy">Healthy</MenuItem>
            <MenuItem eventKey="Unhealthy">Unhealthy</MenuItem>
          </DropdownButton>
        </div>
        <Table hover responsive condensed>
          <thead>
            <tr>
              <th>AZ</th>
              <th>Region</th>
              <th>Instance Type</th>
              <th>Healthy</th>
              <th>Unhealthy</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(healthSummary)
              .sort(this.sort)
              .map(this.renderRow)}
          </tbody>
        </Table>
      </div>
    );
  }
}
