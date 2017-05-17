import React, {Component} from 'react';
import {ListGroup, ListGroupItem, Panel} from 'react-bootstrap';
import {TaskClusterEnhance} from '../../lib/utils';
import './previoustasks.less';

class PreviousTasks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      previousObjectIds: [],
      objectId: '',
      objectType: ''
    };

    this.load = this.load.bind(this);
    this.onTaskClusterReload = this.onTaskClusterReload.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterReload() {
    this.load();
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  load(data) {
    if (data && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {
      previousObjectIds: this.getPreviousObjectIds(this.props.objectType, this.props.objectId),
      objectId: this.props.objectId,
      objectType: this.props.objectType,
    };

    this.props.loadState(promisedState);
  }

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
  }

  render() {
    const objectIds = this.state.previousObjectIds || [];
    const rows = objectIds
      .map(objectId => {
        const link = `${objectId}`;

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
  }
}

const taskclusterOpts = {
  // Reload when props.status.taskId changes, ignore credential changes
  reloadOnProps: ['objectId', 'objectType'],
  reloadOnLogin: false,
  name: PreviousTasks.name
};

export default TaskClusterEnhance(PreviousTasks, taskclusterOpts);
