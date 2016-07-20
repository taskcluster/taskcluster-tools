import React, { Component } from 'react';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';
import { connect } from 'react-redux';
import * as actions from '../actions';

class PurgeCacheButton extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      selected: this.props.caches || []
    };

    this.update = this.update.bind(this);
  }
 
  update(e) { 
    let caches = _.clone(this.state.selected);

    e.target.checked == true ?
      caches.push(e.target.value) :
      caches = caches.filter(i => i !== e.target.value);
    
    this.setState({ selected: caches });
  }

  render() {
    const glyph = 'trash';
    const label = 'Purger Worker Cache';
    const successMsg = 'Cache successfully purged!';
    const { caches = [], provisionerId, workerType, purge } = this.props;
    const selectedCaches = this.state.selected;
    const action = () => purge(provisionerId, workerType, selectedCaches, successMsg);
    
    return (         
      <ConfirmAction label={label} glyph={glyph} action={action}>       
        <div>
          <p>Are you sure you wish to purge caches used in this task across all
            workers of this workerType?</p>
          <p>Select the caches to purge:</p>
          <ul>
            {caches.map((cache) => {
              
              return ( 
                 <li className="checkbox" key={cache}>
                  <label>
                    <input name="cache" type="checkbox" onChange={this.update} value={cache}
                      checked={!this.state.selected ? false : this.state.selected.includes(cache)} />
                    {cache}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </ConfirmAction>              
    );
  }
}

export default connect(null, actions)(PurgeCacheButton);
