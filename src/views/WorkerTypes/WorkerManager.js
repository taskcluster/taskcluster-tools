import React from 'react';
import {
  Button,
  ButtonToolbar,
  DropdownButton,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Breadcrumb,
  OverlayTrigger
} from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { parse, stringify } from 'qs';
import Error from '../../components/Error';
import HelmetTitle from '../../components/HelmetTitle';
import SearchForm from './SearchForm';
import WorkerTypeTable from './WorkerTypeTable';
import OrderByDropdown from './OrderByDropdown';
import styles from './styles.css';

export default class WorkerManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      search: '',
      provisioners: [],
      orderableProperties: [],
      lastActive: true,
      layout: 'grid',
      orderBy: null,
      error: null,
      ...this.getSettingsFromProps(props)
    };
  }

  componentWillMount() {
    this.loadProvisioners();
  }

  async loadProvisioners(token) {
    try {
      const {
        provisioners,
        continuationToken
      } = await this.props.queue.listProvisioners(
        token ? { continuationToken: token, limit: 100 } : { limit: 100 }
      );

      this.setState({
        provisioners: this.state.provisioners
          ? this.state.provisioners.concat(provisioners)
          : provisioners
      });

      if (continuationToken) {
        this.loadProvisioners(continuationToken);
      }
    } catch (err) {
      this.setState({
        provisioners: null,
        error: err
      });
    }
  }

  onProvisionerSelect = ({ provisionerId }) => {
    this.setQuery({ orderBy: 'None' });
    this.props.history.replace(
      `/provisioners/${provisionerId}/worker-types${this.props.location.search}`
    );
  };

  handleLayoutChange = () =>
    this.setQuery({ layout: this.state.layout === 'grid' ? 'table' : 'grid' });

  handleLastActiveClick = () =>
    this.setQuery({ lastActive: !this.state.lastActive, orderBy: null });

  handleOrderBySelect = orderBy =>
    this.setQuery({ orderBy, lastActive: false });

  getSettingsFromProps = props => {
    const settings = parse(props.location.search.slice(1));

    if ('lastActive' in settings) {
      settings.lastActive =
        settings.lastActive !== 'false' && settings.lastActive !== 'true'
          ? true
          : JSON.parse(settings.lastActive);
    }

    return settings;
  };

  constructQuery = q => {
    const query = { ...q };
    const oldQuery = parse(this.props.location.search.slice(1));

    Object.entries(query).forEach(([key, value]) => {
      if (typeof value !== 'boolean' && !value) {
        delete oldQuery[key];
        delete query[key];
      }
    });

    return stringify({ ...oldQuery, ...query });
  };

  setQuery = queryObj => {
    this.setState(queryObj);
    this.props.history.replace(
      `${this.props.location.pathname}?${this.constructQuery(queryObj)}`
    );
  };

  setWorkerType = value => this.setQuery({ search: value });

  setOrderableProperties = (sample = {}) => {
    this.setState({
      orderableProperties: Object.entries(sample).reduce(
        (props, [key, value]) =>
          typeof value === 'number' ? [...props, key] : props,
        []
      )
    });
  };

  render() {
    const { provisionerId, awsProvisioner, queue } = this.props;
    const tooltip = (
      <Tooltip id="last-active">
        Last active may be off by up-to 6 hours.
      </Tooltip>
    );

    return (
      <div>
        <div>
          <HelmetTitle title="Worker Types Explorer" />
          <h4>Worker Types Explorer</h4>
        </div>
        <Breadcrumb>
          <Breadcrumb.Item href={`/provisioners/${provisionerId}`}>
            {provisionerId}
          </Breadcrumb.Item>
          <Breadcrumb.Item
            active
            href={`/provisioners/${provisionerId}/worker-types`}>
            worker-types
          </Breadcrumb.Item>
        </Breadcrumb>
        <DropdownButton
          id="provisioner-dropdown"
          bsSize="small"
          title={`Provisioner: ${provisionerId || 'None'}`}
          onSelect={this.onProvisionerSelect}>
          {this.state.provisioners.map((provisioner, key) => (
            <MenuItem
              eventKey={provisioner}
              key={`provisioner-dropdown-${key}`}>
              {provisioner.provisionerId}
            </MenuItem>
          ))}
        </DropdownButton>
        {this.state.error && <Error error={this.state.error} />}
        {provisionerId && (
          <SearchForm
            default={this.state.search}
            provisionerId={provisionerId}
            onSearch={this.setWorkerType}
          />
        )}
        {provisionerId && (
          <div>
            <ButtonToolbar className={styles.optionsToolbar}>
              <div>
                <OverlayTrigger placement="right" overlay={tooltip}>
                  <Button onClick={this.handleLastActiveClick} bsSize="sm">
                    <Icon
                      name={
                        this.state.lastActive ? 'check-square-o' : 'square-o'
                      }
                    />
                    &nbsp;&nbsp;Last active
                  </Button>
                </OverlayTrigger>
              </div>
              <OrderByDropdown
                onSelect={this.handleOrderBySelect}
                orderBy={this.state.orderBy}
                orderableProperties={this.state.orderableProperties}
              />
              <ToggleButtonGroup
                bsSize="sm"
                onChange={this.handleLayoutChange}
                type="radio"
                name="options"
                defaultValue={this.state.layout}>
                <ToggleButton value="grid">
                  <Icon name="table" />&nbsp;&nbsp;Grid
                </ToggleButton>
                <ToggleButton value="table">
                  <Icon name="th" />&nbsp;&nbsp;Table
                </ToggleButton>
              </ToggleButtonGroup>
            </ButtonToolbar>
          </div>
        )}
        {provisionerId && (
          <WorkerTypeTable
            queue={queue}
            awsProvisioner={awsProvisioner}
            provisionerId={provisionerId}
            lastActive={this.state.lastActive}
            setOrderableProperties={this.setOrderableProperties}
            orderBy={this.state.orderBy}
            layout={this.state.layout}
            searchTerm={this.state.search}
          />
        )}
      </div>
    );
  }
}
