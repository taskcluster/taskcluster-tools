import React from 'react';
import ConfirmAction from './confirmaction';
import _ from 'lodash';
import taskcluster from 'taskcluster-client';
import * as utils from '../utils';

const PurgeCacheButton = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        purgeCache: taskcluster.PurgeCache
      }
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired,
    workerType: React.PropTypes.string.isRequired,
    caches: React.PropTypes.array
  },

  getInitialState() {
    return {
      purged: null,
      selected: this.props.caches || []
    };
  },

  render() {
    return (
      <ConfirmAction
        buttonSize="xsmall"
        buttonStyle="danger"
        disabled={this.props.caches == null}
        glyph="trash"
        label="Purge worker cache"
        action={this.purge}
        success="Cache successfully purged!">
        <div>
          <p>
            Are you sure you wish to purge caches used in this task across all
            workers of this workerType?
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
                    checked={this.state.selected === null ?
                      false :
                      this.state.selected.includes(cache)}
                    value={cache} />
                  {cache}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </ConfirmAction>
    );
  },

  update(e) {
    let caches = _.clone(this.state.selected);

    if (e.target.checked) {
      caches.push(e.target.value);
    } else {
      caches = caches.filter(i => i !== e.target.value);
    }

    this.setState({ selected: caches });
  },
  purge() {
    const promises = this.state.selected.map(cacheName => this.purgeCache
      .purgeCache(this.props.provisionerId, this.props.workerType, { cacheName }));

    return Promise.all(promises);
  }
});

export default PurgeCacheButton;
