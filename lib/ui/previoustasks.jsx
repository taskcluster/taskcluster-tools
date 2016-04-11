var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../../lib/utils');

var PreviousTasks = React.createClass({

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps:          ['objectId', 'objectType'],
      reloadOnLogin:          false
    })
  ],

  getPreviousObjectIds(type, newId) {
    var ids = [];
    var itemKey = 'inspector-items-' + type;
    try {
      var itemValue = JSON.parse(localStorage.getItem(itemKey));
      if (itemValue) {
        ids = itemValue;
      }
    } catch(e) {
      console.error(e);
      localStorage.setItem(itemKey, JSON.stringify(ids));
    }
    if (newId) {
      var prevIndex = ids.indexOf(newId);
      if (prevIndex != -1) {
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
    var objectIds = this.state.previousObjectIds || [];
    var rows = objectIds.map(objectId => {
      var link = "#" + objectId;
      return (<li key={objectId}><a href={link}>{objectId}</a></li>);
    });
    rows.reverse(); // show most recent first

    if (rows.length === 0) {
      switch(this.state.objectType) {
        case "taskGraphId":
          return (
            <span>
              <p>Find tasks at <a href="/index">index</a>, then click their TaskGroupId link to see task graphs</p>
            </span>
          );
        case "taskId":
          return (
            <span>
              <p>Find tasks at <a href="/index">index</a></p>
            </span>
          );
      }
    };

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

module.exports = PreviousTasks;
