import React from 'react';
import { Autocomplete, FontIcon } from 'react-md';

export default class GlobalSearch extends React.PureComponent {
  state = {
    value: ''
  };

  handleOnChange = ({ target }) => {
    this.setState({ value: target.value });
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
        filter={null}
        data={[]}
        total={0}
        style={{ position: 'absolute', width: 80, right: 250 }}
        leftIcon={<FontIcon>search</FontIcon>}
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
