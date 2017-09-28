import React, { PureComponent } from 'react';
import { func } from 'prop-types';
import {
  Glyphicon,
  FormGroup,
  InputGroup,
  FormControl,
  Form
} from 'react-bootstrap';
import styles from './styles.css';

export default class SearchForm extends PureComponent {
  static propTypes = {
    onSearch: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { value: '' };
  }

  componentWillMount() {
    if (this.props.default) {
      this.setState({ value: this.props.default });
    }
  }

  componentWillReceiveProps({ provisionerId }) {
    if (provisionerId !== this.props.provisionerId) {
      this.setState({ value: '' }, this.onSearch);
    }
  }

  onChange = e => this.setState({ value: e.target.value });

  onSearch = () => this.props.onSearch(this.state.value);

  onSubmit = e => {
    e.preventDefault();

    this.onSearch();
  };

  render() {
    return (
      <div>
        <Form onSubmit={this.onSubmit} className={styles.typeInput}>
          <FormGroup>
            <InputGroup bsSize="sm">
              <InputGroup.Addon>WorkerType Containing</InputGroup.Addon>
              <FormControl
                onChange={this.onChange}
                value={this.state.value}
                type="text"
              />
              <InputGroup.Addon onClick={this.onSearch} role="button">
                <Glyphicon glyph="search" />
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Form>
      </div>
    );
  }
}
