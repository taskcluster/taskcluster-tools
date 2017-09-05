import React from 'react';
import { Button, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';
import SwitchButton from 'react-switch-button';
import Icon from 'react-fontawesome';
import 'react-switch-button/dist/react-switch-button.css';
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
      orderableProperties: [],
      lastActive: true,
      gridLayout: true,
      orderBy: null,
      provisioners: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadProvisioners();
  }

  async loadProvisioners(token) {
    this.setState({ provisioners: [] }, async () => {
      try {
        const { provisioners, continuationToken } = await this.props.queue
          .listProvisioners(token ? { continuationToken: token, limit: 100 } : { limit: 100 });

        this.setState({
          provisioners: this.state.provisioners ? this.state.provisioners.concat(provisioners) : provisioners
        });

        if (continuationToken) {
          await this.loadProvisioners(continuationToken);
        }
      } catch (err) {
        this.setState({ provisioners: null, error: err });
      }
    });
  }

  onProvisionerSelect = ({ provisionerId }) => {
    this.setState({ lastActive: true, orderBy: null });
    this.props.history.replace(
      `/worker-types/${provisionerId ? encodeURIComponent(provisionerId) : ''}`
    );
  };

  handleSwitchChange = () => this.setState({ gridLayout: !this.state.gridLayout });

  handleLastActiveClick = () => this.setState({ lastActive: !this.state.lastActive, orderBy: null });

  handleOrderBySelect = orderBy => this.setState({ orderBy, lastActive: false });

  setWorkerType = value => this.setState({ workerTypeContains: value });

  setOrderableProperties = (sample) => {
    const orderableProperties = [];

    if (sample) {
      Object.keys(sample).forEach((key) => {
        if (typeof sample[key] === 'number') {
          orderableProperties.push(key);
        }
      });
    }

    this.setState({ orderableProperties });
  };

  renderWorkerTypeTable = () => (
    <WorkerTypeTable
      key="table"
      queue={this.props.queue}
      awsProvisioner={this.props.awsProvisioner}
      provisionerId={this.props.provisionerId}
      lastActive={this.state.lastActive}
      setOrderableProperties={this.setOrderableProperties}
      orderBy={this.state.orderBy}
      gridLayout={this.state.gridLayout}
      searchTerm={this.state.workerTypeContains} />
  );

  renderProvisionerDropdown = () => (
    <DropdownButton
      key="dropdown-provisioner"
      id="provisioner-dropdown"
      bsSize="small"
      title={`Provisioner: ${this.props.provisionerId || 'None'}`}
      onSelect={this.onProvisionerSelect}>
      {
        this.state.provisioners.map((provisioner, index) => (
          <MenuItem eventKey={provisioner} key={`provisioner-dropdown-${index}`}>
            {provisioner.provisionerId}
          </MenuItem>
        ))
      }
    </DropdownButton>
  );

  renderHeader = () => (
    <div key="header">
      <HelmetTitle title="Worker-types Explorer" />
      <h4>Worker-types Explorer</h4>
    </div>
  );

  renderSearchForm = () => (
    <SearchForm
      key="search"
      provisionerId={this.props.provisionerId}
      onSearch={this.setWorkerType} />
  );

  renderOptions = () => (
    <ButtonToolbar className={styles.optionsToolbar} key="options">
      <Button onClick={this.handleLastActiveClick} bsSize="sm">
        <Icon name={this.state.lastActive ? 'check-square-o' : 'square-o'} />
        &nbsp;&nbsp;Last active
      </Button>
      <OrderByDropdown
        onSelect={this.handleOrderBySelect}
        orderBy={this.state.orderBy}
        orderableProperties={this.state.orderableProperties} />
      <span className={styles.switchButton}>
        <SwitchButton
          name="switch"
          theme="rsbc-switch-button-flat-square"
          onChange={this.handleSwitchChange}
          defaultChecked={true}
          label="Tabular"
          labelRight="Grid" />
      </span>
    </ButtonToolbar>
  );

  render() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    if (!this.props.provisionerId) {
      return (
        <div>
          {[
            this.renderHeader(),
            this.renderProvisionerDropdown()
          ]}
        </div>
      );
    }

    return (
      <div>
        {[
          this.renderHeader(),
          this.renderProvisionerDropdown(),
          this.props.provisionerId && this.renderSearchForm(),
          this.props.provisionerId && this.renderOptions(),
          this.props.provisionerId && this.renderWorkerTypeTable()
        ]}
      </div>
    );
  }
}
