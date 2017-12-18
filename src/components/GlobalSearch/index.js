import React from 'react';
import { Autocomplete, FontIcon } from 'react-md';
import search from './search';
import './styles.scss';

export default class GlobalSearch extends React.PureComponent {
  state = {
    value: ''
  };

  handleOnChange = value => this.setState({ value });

  handleGlobalSearch = (suggestion, suggestionIndex, matches) => {
    const match = matches[suggestionIndex];

    this.props.history.push(match.url);
  };

  render() {
    return (
      <Autocomplete
        id="documentation-search"
        placeholder="Search"
        inputClassName={
          'search__input search__input--visible search__input--active'
        }
        onChange={this.handleOnChange}
        onAutocomplete={this.handleGlobalSearch}
        autocompleteWithLabel={true}
        data={search(this.state.value)}
        dataLabel="primaryText"
        leftIcon={<FontIcon>search</FontIcon>}
        total={0}
        style={{ position: 'absolute', width: 80, right: 250 }}
        listClassName="search__results"
        value={this.state.value}
        sameWidth={false}
        simplifiedMenu={false}
        minBottom={20}
        fillViewportWidth={false}
        fillViewportHeight={false}
      />
    );
  }
}
