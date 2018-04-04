import { Component } from 'react';
import { func, string } from 'prop-types';
import {
  Glyphicon,
  FormGroup,
  InputGroup,
  FormControl,
  Form
} from 'react-bootstrap';
import { typeInput } from './styles.module.css';

export default class SearchForm extends Component {
  static propTypes = {
    onSearch: func.isRequired,
    label: string
  };

  static defaultProps = {
    label: 'Value Containing'
  };

  state = { value: '' };

  handleSearchChange = e => {
    this.setState({ value: e.target.value });
  };

  handleSearch = () => this.props.onSearch(this.state.value);

  handleSubmit = e => {
    e.preventDefault();
    this.handleSearchChange();
  };

  render() {
    return (
      <div>
        <Form onSubmit={this.handleSubmit} className={typeInput}>
          <FormGroup>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>{this.props.label}</InputGroup.Addon>
              <FormControl
                value={this.state.value}
                onChange={this.handleSearchChange}
                type="text"
              />
              <InputGroup.Addon onClick={this.handleSearch} role="button">
                <Glyphicon glyph="search" />
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Form>
      </div>
    );
  }
}
