import { PureComponent } from 'react';
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
import styles from './styles.module.css';

export default class SearchForm extends PureComponent {
  static propTypes = {
    provisioners: array.isRequired,
    workerTypes: array.isRequired,
    provisionerId: string.isRequired,
    workerType: string.isRequired,
    workerGroup: string.isRequired,
    workerId: string.isRequired,
    onLoadWorker: func.isRequired,
    onUpdateURI: func,
    onLoadWorkerTypes: func
  };

  constructor(props) {
    super(props);
    this.state = {
      provisionerIdInput: this.props.provisionerId,
      workerTypeInput: this.props.workerType,
      workerGroupInput: this.props.workerGroup,
      workerIdInput: this.props.workerId
    };
  }

  componentWillUpdate(nextProps, { provisionerIdInput }) {
    if (this.state.provisionerIdInput !== provisionerIdInput) {
      this.props.onLoadWorkerTypes(provisionerIdInput);
    }
  }

  handleSubmit = e => {
    e.preventDefault();

    const {
      provisionerIdInput,
      workerTypeInput,
      workerGroupInput,
      workerIdInput
    } = this.state;

    // Clicking enter on the worker-type drop-down while having the workerGroup and workerId input fields filled
    // should not update
    if (
      this.props.workerGroup === this.state.workerGroupInput &&
      this.props.workerId === this.state.workerIdInput &&
      this.props.provisionerId === this.state.provisionerIdInput
    ) {
      return;
    }

    this.props.onUpdateURI(
      provisionerIdInput,
      workerTypeInput,
      workerGroupInput,
      workerIdInput
    );
    this.props.onLoadWorker(
      provisionerIdInput,
      workerTypeInput,
      workerGroupInput,
      workerIdInput
    );
  };

  handleProvisionerSelect = provisionerId => {
    if (provisionerId === this.state.provisionerIdInput) {
      return;
    }

    this.setState({
      provisionerIdInput: provisionerId,
      workerTypeInput: '',
      workerGroupInput: '',
      workerIdInput: ''
    });
  };

  handleWorkerTypeSelect = workerType => {
    if (workerType === this.props.workerType) {
      return;
    }

    this.setState({
      workerTypeInput: workerType,
      workerGroupInput: '',
      workerIdInput: ''
    });
  };

  renderWorkerTypeDropdown = () => {
    const options = this.props.workerTypes.map(
      workerType => workerType.workerType
    );
    const disabled = !this.props.provisionerId || !options.length;

    return (
      <div>
        <Combobox
          value={this.state.workerTypeInput}
          options={options}
          onSelect={this.handleWorkerTypeSelect}>
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

  handleChangeWorkerGroup = e =>
    this.setState({ workerGroupInput: e.target.value.trim() });

  handleChangeWorkerId = e =>
    this.setState({ workerIdInput: e.target.value.trim() });

  render() {
    const {
      provisionerIdInput,
      workerTypeInput,
      workerGroupInput,
      workerIdInput
    } = this.state;
    const valid =
      provisionerIdInput &&
      workerTypeInput &&
      workerGroupInput &&
      workerIdInput;

    return (
      <div>
        <Form
          className={styles.searchForm}
          horizontal
          onSubmit={this.handleSubmit}>
          <DropdownButton
            id="provisioner-dropdown"
            bsSize="small"
            title={`Provisioner: ${provisionerIdInput || 'None'}`}
            onSelect={this.handleProvisionerSelect}>
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
                disabled={!workerTypeInput}
                value={workerGroupInput}
                onChange={this.handleChangeWorkerGroup}
                type="text"
              />
            </InputGroup>
          </div>
          <div className={styles.typeInput}>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>Worker ID</InputGroup.Addon>
              <FormControl
                disabled={!workerTypeInput}
                value={workerIdInput}
                onChange={this.handleChangeWorkerId}
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
