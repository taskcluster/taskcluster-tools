import React, {Component} from 'react';
import ConfirmActionMenuItem from './ConfirmActionMenuItem';
import _ from 'lodash';
import taskcluster from 'taskcluster-client';
import {TaskClusterEnhance} from '../utils';

class PurgeCacheMenuItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      purged: null,
      selected: this.props.caches || []
    };

    this.update = this.update.bind(this);
    this.purge = this.purge.bind(this);
  }

  render() {
    return (
      <ConfirmActionMenuItem
        disabled={this.props.caches == null}
        glyph="trash"
        label="Purge worker cache"
        action={this.purge}
        success="Cache successfully purged!">
        <div>
          <p>
            Are you sure you wish to purge caches used in this task across all workers of this
            workerType?
          </p>
          <p>Select the caches to purge:</p>
          <ul>
            {(this.props.caches || []).map(cache => (
              <li className="checkbox" key={cache}>
                <label>
                  <input
                    name="cache"
                    type="checkbox"
                    onChange={this.update}
                    checked={this.state.selected === null ? false : this.state.selected.includes(cache)}
                    value={cache} />
                  {cache}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </ConfirmActionMenuItem>
    );
  }

  update(e) {
    let caches = _.clone(this.state.selected);

    if (e.target.checked) {
      caches.push(e.target.value);
    } else {
      caches = caches.filter(i => i !== e.target.value);
    }

    this.setState({selected: caches});
  }

  purge() {
    const promises = this.state.selected.map(cacheName => this.props.clients.purgeCache
      .purgeCache(this.props.provisionerId, this.props.workerType, {cacheName}));

    return Promise.all(promises);
  }
}

PurgeCacheMenuItem.propTypes = {
  provisionerId: React.PropTypes.string.isRequired,
  workerType: React.PropTypes.string.isRequired,
  caches: React.PropTypes.array
};

const taskclusterOpts = {
  clients: {
    purgeCache: taskcluster.PurgeCache,
  },
  name: PurgeCacheMenuItem.name
};

export default TaskClusterEnhance(PurgeCacheMenuItem, taskclusterOpts);
