import React, { PureComponent } from 'react';
import Icon from 'react-fontawesome';
import { string, array, func } from 'prop-types';
import { InputGroup, FormControl, Form, Button, DropdownButton, MenuItem } from 'react-bootstrap';
import { Combobox } from 'react-input-enhancements';
import styles from './styles.css';

export default class SearchForm extends PureComponent {
  static propTypes = {
    provisioners: array.isRequired,
    workerTypes: array.isRequired,
    provisionerId: string.isRequired,
    workerType: string.isRequired,
    workerGroup: string.isRequired,
    workerId: string.isRequired,
    loadWorker: func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      workerGroupInput: this.props.workerGroup,
      workerIdInput: this.props.workerId
    };
  }

  onSubmit = (e) => {
    const { provisionerId, workerType } = this.props;

    e.preventDefault();

    this.props.updateURI(provisionerId, workerType, this.state.workerGroupInput, this.state.workerIdInput, true);
    this.props.loadWorker(provisionerId, workerType, this.state.workerGroupInput, this.state.workerIdInput);
  };

  onProvisionerSelect = (provisionerId) => {
    this.props.updateURI(provisionerId);
    this.setState({ workerGroupInput: '', workerIdInput: '' });
  };

  onWorkerTypeSelect = (workerType) => {
    this.props.updateURI(this.props.provisionerId, workerType);
  };

  renderWorkerTypeDropdown = () => {
    const options = this.props.workerTypes.map(workerType => workerType.workerType);
    const disabled = !this.props.provisionerId || !options.length;

    return (
      <div>
        <Combobox
          value={this.props.workerType}
          options={options}
          onSelect={this.onWorkerTypeSelect}>
          {props => (
            <FormControl
              {...props}
              disabled={disabled}
              bsSize="small"
              type="text"
              placeholder="Worker-type: None" />
          )}
        </Combobox>
      </div>
    );
  };

  workerGroupOnChange = e => this.setState({ workerGroupInput: e.target.value.trim() });

  workerIdOnChange = e => this.setState({ workerIdInput: e.target.value.trim() });

  render() {
    const { provisionerId, workerType } = this.props;
    const valid = provisionerId && workerType && this.state.workerGroupInput && this.state.workerIdInput;

    return (
      <div>
        <Form className={styles.searchForm} horizontal onSubmit={this.onSubmit}>
          <DropdownButton
            id="provisioner-dropdown"
            bsSize="small"
            title={`Provisioner: ${this.props.provisionerId || 'None'}`}
            onSelect={this.onProvisionerSelect}>
            {this.props.provisioners.map(({ provisionerId }, key) => (
              <MenuItem eventKey={provisionerId} key={`provisioner-dropdown-${key}`}>
                {provisionerId}
              </MenuItem>
            ))}
          </DropdownButton>

          {this.renderWorkerTypeDropdown()}

          <div className={styles.typeInput}>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>Worker Group</InputGroup.Addon>
              <FormControl
                disabled={!workerType}
                value={this.state.workerGroupInput}
                onChange={this.workerGroupOnChange} type="text" />
            </InputGroup>
          </div>
          <div className={styles.typeInput}>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>Worker ID</InputGroup.Addon>
              <FormControl
                disabled={!workerType}
                value={this.state.workerIdInput}
                onChange={this.workerIdOnChange} type="text" />
            </InputGroup>
          </div>
          <div>
            <Button disabled={!valid} type="submit" bsSize="sm">
              <Icon name="search" /> Inspect
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
