import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import _ from 'lodash';

export default class ArtifactList extends Component {

	renderArtifactList() {
		const { artifacts } = this.props;
		if(!!artifacts.length) {
	      return artifacts.map((artifact,index) => {
	        return (
	          <li key={index}><a>{artifact.name}</a></li>
	        )
	      });
    	}
	}


	render() {
	    
	    const artifactList = this.renderArtifactList();

	    return (
	      <div>
	        {artifactList}
	      </div>
	    );
  	}

}
