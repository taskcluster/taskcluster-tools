import React from 'react';
import { Button, ButtonToolbar, DropdownButton, MenuItem, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import Icon from 'react-fontawesome';
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
      workerTypeContains: '',
      provisioners: [],
      orderableProperties: [],
      lastActive: true,
      gridLayout: true,
      orderBy: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadProvisioners();
  }

  async loadProvisioners(token) {
    try {
      const { provisioners, continuationToken } = await this.props.queue
        .listProvisioners(token ? { continuationToken: token, limit: 100 } : { limit: 100 });

      this.setState({
        provisioners: this.state.provisioners ?
          this.state.provisioners.concat(provisioners) :
          provisioners
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
    this.setState({ lastActive: true, orderBy: null });
    this.props.history.replace(
      `/worker-types/${provisionerId ? encodeURIComponent(provisionerId) : ''}`
    );
  };

  handleLayoutChange = () => this.setState({ gridLayout: !this.state.gridLayout });

  handleLastActiveClick = () => this.setState({ lastActive: !this.state.lastActive, orderBy: null });

  handleOrderBySelect = orderBy => this.setState({ orderBy, lastActive: false });

  setWorkerType = value => this.setState({ workerTypeContains: value });

  setOrderableProperties = (sample = {}) => {
    this.setState({
      orderableProperties: Object
        .entries(sample)
        .reduce((props, [key, value]) => (typeof value === 'number' ? [...props, key] : props), [])
    });
  };

  render() {
    return (
      <div>
        <div>
          <HelmetTitle title="Worker Types Explorer" />
          <h4>Worker Types Explorer</h4>
        </div>
        <DropdownButton
          id="provisioner-dropdown"
          bsSize="small"
          title={`Provisioner: ${this.props.provisionerId || 'None'}`}
          onSelect={this.onProvisionerSelect}>
          {this.state.provisioners.map((provisioner, key) => (
            <MenuItem eventKey={provisioner} key={`provisioner-dropdown-${key}`}>
              {provisioner.provisionerId}
            </MenuItem>
          ))}
        </DropdownButton>
        {this.state.error && <Error error={this.state.error} />}
        {this.props.provisionerId &&
          <SearchForm
            provisionerId={this.props.provisionerId}
            onSearch={this.setWorkerType} />
        }
        {this.props.provisionerId &&
          <div>
            <ButtonToolbar className={styles.optionsToolbar}>
              <div>
                <Button onClick={this.handleLastActiveClick} bsSize="sm">
                  <Icon name={this.state.lastActive ? 'check-square-o' : 'square-o'} />
                  &nbsp;&nbsp;Last active
                </Button>
              </div>
              <OrderByDropdown
                onSelect={this.handleOrderBySelect}
                orderBy={this.state.orderBy}
                orderableProperties={this.state.orderableProperties} />
              <ToggleButtonGroup bsSize="sm" onChange={this.handleLayoutChange} type="radio" name="options" defaultValue={1}>
                <ToggleButton value={1}><Icon name="table" />&nbsp;&nbsp;Grid</ToggleButton>
                <ToggleButton value={2}><Icon name="th" />&nbsp;&nbsp;Table</ToggleButton>
              </ToggleButtonGroup>
            </ButtonToolbar>
          </div>
        }
        {this.props.provisionerId &&
          <WorkerTypeTable
            queue={this.props.queue}
            awsProvisioner={this.props.awsProvisioner}
            provisionerId={this.props.provisionerId}
            lastActive={this.state.lastActive}
            setOrderableProperties={this.setOrderableProperties}
            orderBy={this.state.orderBy}
            gridLayout={this.state.gridLayout}
            searchTerm={this.state.workerTypeContains} />
        }
      </div>
    );
  }
}
