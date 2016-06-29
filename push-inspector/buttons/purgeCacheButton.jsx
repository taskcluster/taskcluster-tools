import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';
import { connect } from 'react-redux';
import * as actions from '../actions';

class PurgeCacheButton extends Component {

  constructor(props) {
    super(props);
    
    this.state = {
    	selected: this.props.caches || []
    }

    this.update = this.update.bind(this);
  }

  
  update(e) {	
  	var caches = _.clone(this.state.selected);
    if (e.target.checked === true) {
      caches.push(e.target.value);
    } else if (e.target.checked === false) {
      caches = caches.filter(i => i !== e.target.value);
    }
    this.setState({ selected: caches });
  }

  render() {
    
    const 	glyph = "trash",
    		    label = "Purger Worker Cache",
            successMsg = "Cache successfully purged!",
            selectedCaches = this.state.selected,
    		    { caches, provisionerId, workerType, purge } = this.props;

    return (         
      <ConfirmAction 
        	label = {label}
        	glyph = {glyph}
        	action = {() => { purge(provisionerId, workerType, selectedCaches, successMsg)}} >
            
        	<div>
            <p>Are you sure you wish to purge caches used in this task across all
              workers of this workerType?</p>
            <p>Select the caches to purge:</p>
            <ul>
              {(caches || []).map(cache => {
                 return (
                   <li className="checkbox" key={cache}>
                     <label>
                       <input name="cache"
                              type="checkbox"
                              onChange={this.update}
                              checked={this.state.selected === undefined ? false : this.state.selected.indexOf(cache) !== -1}
                              value={cache}/>
                       {cache}
                     </label>
                   </li>);
                })}
            </ul>
          </div>

    	</ConfirmAction>              
    );
  }

}


export default connect(null, actions )(PurgeCacheButton)