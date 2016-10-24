import React from 'react';
import {ListGroup, ListGroupItem, Panel} from 'react-bootstrap';
import * as utils from '../../lib/utils';
import './previoustasks.less';

export default React.createClass({
  displayName: 'PreviousTasks',

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps: ['objectId', 'objectType'],
      reloadOnLogin: false,
    }),
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
      objectType: this.props.objectType,
    };
  },

  getInitialState() {
    return {
      previousObjectIds: [],
      objectId: '',
      objectType: '',
    };
  },

  render() {
    const objectIds = this.state.previousObjectIds || [];
    const rows = objectIds
      .map(objectId => {
        const link = `#${objectId}`;
        return <ListGroupItem key={objectId} href={link}>{objectId}</ListGroupItem>;
      })
      // show most recent first
      .reverse();

    if (!rows.length) {
      switch (this.state.objectType) {
        case 'taskGraphId':
          return (
            <ListGroupItem>
              Find tasks at the <a href="/index">index</a>, then
              click their TaskGroupId link to see task graphs.
            </ListGroupItem>
          );
        case 'taskId':
        default:
          return (
            <ListGroupItem>
              Find tasks at the <a href="/index">index</a>.
            </ListGroupItem>
          );
      }
    }

    return (
      <Panel header="Previously Viewed Tasks" collapsible={true} defaultExpanded={false}>
        <ListGroup fill={true}>
          {rows}
        </ListGroup>
      </Panel>
    );
  },
});
