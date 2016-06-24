import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

export default class PurgeCacheButton extends Component {

  constructor(props) {
    super(props);
    
    this.state = {
    	selected: this.props.caches || []
    }

    this.update = this.update.bind(this);
    this.purge = this.purge.bind(this);
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

  purge() {
    
    let purgeCache = new taskcluster.PurgeCache({
      credentials: JSON.parse(localStorage.credentials)
    });

    return Promise.all(this.state.selected.map(cache => {
      return purgeCache.purgeCache(
        this.props.provisionerId, this.props.workerType, {cacheName: cache});
    }));
  }


  render() {
    
    const 	glyph = "trash",
    		    label = "Purger Worker Cache",
    		    { caches, provisionerId, workerType } = this.props;

    

    return (         
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {this.purge} >
            
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
