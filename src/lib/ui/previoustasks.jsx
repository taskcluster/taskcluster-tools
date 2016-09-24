import React from 'react';
import * as utils from '../../lib/utils';

const PreviousTasks = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps: ['objectId', 'objectType'],
      reloadOnLogin: false
    })
  ],

  getPreviousObjectIds(type, newId) {
    let ids = [];
    const itemKey = `inspector-items-${type}`;

    try {
      const itemValue = JSON.parse(localStorage.getItem(itemKey));

      if (itemValue) {
        ids = itemValue;
      }
    } catch (e) {
      console.error(e);
      localStorage.setItem(itemKey, JSON.stringify(ids));
    }
    if (newId) {
      const prevIndex = ids.indexOf(newId);

      if (prevIndex !== -1) {
        ids.splice(prevIndex, 1);
      }

      ids.push(newId);

      while (ids.length > 5) {
        ids.shift();
      }

      // only save when there is a new taskId
      localStorage.setItem(itemKey, JSON.stringify(ids));
    }

    return ids;
  },

  load() {
    return {
      previousObjectIds: this.getPreviousObjectIds(this.props.objectType, this.props.objectId),
      objectId: this.props.objectId,
      objectType: this.props.objectType
    };
  },

  getInitialState() {
    return {
      previousObjectIds: [],
      objectId: '',
      objectType: ''
    };
  },

  render() {
    const objectIds = this.state.previousObjectIds || [];
    const rows = objectIds
      .map(objectId => {
        const link = `#${objectId}`;
        return <li key={objectId}><a href={link}>{objectId}</a></li>;
      })
      // show most recent first
      .reverse();

    if (!rows.length) {
      switch (this.state.objectType) {
        case 'taskGraphId':
          return (
            <span>
              <p>
                Find tasks at <a href="/index">index</a>, then
                click their TaskGroupId link to see task graphs
              </p>
            </span>
          );
        case 'taskId':
        default:
          return (
            <span>
              <p>Find tasks at <a href="/index">index</a></p>
            </span>
          );
      }
    }

    return (
      <span>
        <strong>Previously Viewed Tasks</strong>
        <ul>
          {rows}
        </ul>
      </span>
    );
  }
});

export default PreviousTasks;
