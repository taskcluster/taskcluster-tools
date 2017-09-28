import React, { PureComponent } from 'react';
import Icon from 'react-fontawesome';
import { string, array, func } from 'prop-types';
import {
  InputGroup,
  FormControl,
  Form,
  Button,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
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
      provisionerId: this.props.provisionerId,
      workerType: this.props.workerType,
      workerGroupInput: this.props.workerGroup,
      workerIdInput: this.props.workerId
    };
  }

  componentWillUpdate(nextProps, { provisionerId }) {
    if (this.state.provisionerId !== provisionerId) {
      this.props.loadWorkerTypes(provisionerId);
    }
  }

  onSubmit = e => {
    e.preventDefault();

    const {
      provisionerId,
      workerType,
      workerGroupInput,
      workerIdInput
    } = this.state;

    // Clicking enter on the worker-type drop-down while having the workerGroup and workerId input fields filled
    // should not update
    if (
      this.props.workerGroup === this.state.workerGroupInput &&
      this.props.workerId === this.state.workerIdInput &&
      this.props.provisionerId === this.state.provisionerId
    ) {
      return;
    }

    this.props.updateURI(
      provisionerId,
      workerType,
      workerGroupInput,
      workerIdInput
    );
    this.props.loadWorker(
      provisionerId,
      workerType,
      workerGroupInput,
      workerIdInput
    );
  };

  onProvisionerSelect = provisionerId => {
    if (provisionerId === this.state.provisionerId) {
      return;
    }

    this.setState({
      provisionerId,
      workerType: '',
      workerGroupInput: '',
      workerIdInput: ''
    });
  };

  onWorkerTypeSelect = workerType => {
    if (workerType === this.props.workerType) {
      return;
    }

    this.setState({ workerType, workerGroupInput: '', workerIdInput: '' });
  };

  renderWorkerTypeDropdown = () => {
    const options = this.props.workerTypes.map(
      workerType => workerType.workerType
    );
    const disabled = !this.props.provisionerId || !options.length;

    return (
      <div>
        <Combobox
          value={this.state.workerType}
          options={options}
          onSelect={this.onWorkerTypeSelect}>
          {props => (
            <FormControl
              {...props}
              disabled={disabled}
              bsSize="small"
              type="text"
              placeholder="Worker-type: None"
            />
          )}
        </Combobox>
      </div>
    );
  };

  workerGroupOnChange = e =>
    this.setState({ workerGroupInput: e.target.value.trim() });

  workerIdOnChange = e =>
    this.setState({ workerIdInput: e.target.value.trim() });

  render() {
    const {
      provisionerId,
      workerType,
      workerGroupInput,
      workerIdInput
    } = this.state;

    const valid =
      provisionerId && workerType && workerGroupInput && workerIdInput;

    return (
      <div>
        <Form className={styles.searchForm} horizontal onSubmit={this.onSubmit}>
          <DropdownButton
            id="provisioner-dropdown"
            bsSize="small"
            title={`Provisioner: ${provisionerId || 'None'}`}
            onSelect={this.onProvisionerSelect}>
            {this.props.provisioners.map(({ provisionerId }, key) => (
              <MenuItem
                eventKey={provisionerId}
                key={`provisioner-dropdown-${key}`}>
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
                value={workerGroupInput}
                onChange={this.workerGroupOnChange}
                type="text"
              />
            </InputGroup>
          </div>
          <div className={styles.typeInput}>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>Worker ID</InputGroup.Addon>
              <FormControl
                disabled={!workerType}
                value={workerIdInput}
                onChange={this.workerIdOnChange}
                type="text"
              />
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
