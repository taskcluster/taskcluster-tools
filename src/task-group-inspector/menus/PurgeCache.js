import React, {Component} from 'react';
import ConfirmAction from './ConfirmAction';
import {connect} from 'react-redux';
import * as actions from '../actions';

class PurgeCache extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: this.props.caches || []};
  }

  update(e) {
    this.setState({
      selected: e.target.checked ?
        [...this.state.selected, e.target.value] :
        this.state.selected.filter(c => c !== e.target.value),
    });
  }

  render() {
    const {caches = [], provisionerId, workerType, purge} = this.props;
    const selectedCaches = this.state.selected;

    return (
      <ConfirmAction
        label="Purger Worker Cache"
        glyph="trash"
        action={() => purge(provisionerId, workerType, selectedCaches, 'Cache successfully purged!')}>
        <div>
          <p>
            Are you sure you wish to purge caches used in this task across all
            workers of this worker type?
          </p>
          <p>Select the caches to purge:</p>
          <ul>
            {caches.map(cache => (
              <li className="checkbox" key={cache}>
                <label>
                  <input
                    name="cache"
                    type="checkbox"
                    onChange={this.update}
                    value={cache}
                    checked={this.state.selected.includes(cache)} />
                  {cache}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </ConfirmAction>
    );
  }
}

export default connect(null, actions)(PurgeCache);
