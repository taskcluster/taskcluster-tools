let ConfirmAction     = require('./confirmaction');
let React           = require('react');
let _               = require('lodash');
let taskcluster     = require('taskcluster-client');
let utils           = require('../utils');

let PurgeCacheButton = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        purgeCache: taskcluster.PurgeCache
      }
    })
  ],
  propTypes: {
    provisionerId:  React.PropTypes.string.isRequired,
    workerType:     React.PropTypes.string.isRequired,
    caches:         React.PropTypes.array
  },
  getInitialState() {
    return {
      purged: undefined,
      selected: this.props.caches || []
    };
  },
  render() {
    return (
      <ConfirmAction buttonSize="xsmall"
                     buttonStyle="danger"
                     disabled={this.props.caches === undefined}
                     glyph="trash"
                     label="Purge worker cache"
                     action={this.purge}
                     success="Cache successfully purged!">
        <div>
          <p>Are you sure you wish to purge caches used in this task across all
            workers of this workerType?</p>
          <p>Select the caches to purge:</p>
          <ul>
            {(this.props.caches || []).map(cache => {
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
      </ConfirmAction>);
  },
  update(e) {
    var caches = _.clone(this.state.selected);
    if (e.target.checked === true) {
      caches.push(e.target.value);
    } else if (e.target.checked === false) {
      caches = caches.filter(i => i !== e.target.value);
    }
    this.setState({ selected: caches });
  },
  purge() {
    return Promise.all(this.state.selected.map(cache => {
      return this.purgeCache.purgeCache(
          this.props.provisionerId, this.props.workerType, {cacheName: cache});
    }));
  }
});

module.exports = PurgeCacheButton;
