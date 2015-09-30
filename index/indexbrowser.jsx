var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');

/** Generic Index Browser with a custom entryView */
var IndexBrowser = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        index:          taskcluster.Index
      },
      // Reload when state.namespace changes, ignore credentials changes
      reloadOnKeys:           ['namespace', 'namespaceToken', 'tasksToken'],
      reloadOnLogin:          false
    }),
    // Called handler when state.namespace changes
    utils.createWatchStateMixin({
      onKeys: {
        updateNamespaceInput:     ['namespace', 'current'],
        clearContinuationTokens:  ['namespace']
      }
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['namespace', 'current'],
      type:                   'string'
    })
  ],

  propTypes: {
    entryView:        React.PropTypes.func.isRequired,
    hasHashEntry:     React.PropTypes.bool.isRequired
  },

  getInitialState: function() {
    return {
      namespace:        "",
      namespaceInput:   "",
      namespaceToken:   undefined,  // namespace continuationToken
      tasksToken:       undefined,  // tasks continuationToken
      current:          "",         // selected task
      namespaces:       {namespaces: []},
      namespacesLoaded: true,
      namespacesError:  undefined,
      tasks:            {tasks: []},
      tasksLoaded:      true,
      tasksError:       undefined
    };
  },

  load: function() {
    return {
      namespaces:   this.index.listNamespaces(this.state.namespace, {
        continuationToken:  this.state.namespaceToken
      }),
      tasks:        this.index.listTasks(this.state.namespace, {
        continuationToken:  this.state.tasksToken
      })
    };
  },

  render: function() {
    var taskInfo = null;
    if (this.state.namespace) {
      taskInfo = this.renderWaitFor('tasks') || this.renderTasks()
    }
    return (
      <bs.Row>
        <bs.Col md={6} className="index-browser">
          {this.renderBreadcrumbs()}
          <form onSubmit={this.loadNamespaceInput}>
            <bs.Input
              ref="namespace"
              type="text"
              onChange={this.handleNamespaceInputChange}
              value={this.state.namespaceInput}
              buttonAfter={
                <bs.Button bsStyle="primary" onClick={this.loadNamespaceInput}>
                  Browse
                </bs.Button>
              }/>
          </form>
          {taskInfo}
          {this.renderWaitFor('namespaces') || this.renderNamespaces()}
        </bs.Col>
        <bs.Col md={6}>
          <this.props.entryView
            namespace={this.state.current}
            hashEntry={this.props.hasHashEntry ? this.nextHashEntry() : null}
            />
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render bread crumbs for navigation */
  renderBreadcrumbs: function() {
    var parents = this.state.namespace.split('.');
    var name    = parents.pop();
    return (
      <ol className="breadcrumb namespace-breadcrumbs">
        <li key={-1}>
          <a onClick={this.browse.bind(this, "")}>
           root
          </a>
        </li>
        {
          parents.map(function(name, index) {
            var path = parents.slice(0, index + 1).join('.');
            return (
              <li key={index}><a onClick={this.browse.bind(this, path)}>
                {name}
              </a></li>
            );
          }, this)
        }
        {
          name ? (
            <li className="active" key={parents.lenth}>{name}</li>
          ) : undefined
        }
      </ol>
    );
  },

  /** Render list of namespaces */
  renderNamespaces: function() {
    return (
      <span>
      <bs.Table condensed hover className="namespace-table">
        <tbody>
          {
            this.state.namespaces.namespaces.map(function(ns, index) {
              return (
                <tr key={index}>
                  <td onClick={this.browse.bind(this, ns.namespace)}>
                    {ns.name}
                  </td>
                </tr>
              );
            }, this)
          }
        </tbody>
      </bs.Table>
      {
        this.state.namespaceToken != undefined ? (
          <bs.Button bsStyle="primary" onClick={this.clearNamespaceToken}
                     className="pull-left">
            <bs.Glyphicon glyph="arrow-left"/>&nbsp;
            Back to start
          </bs.Button>
        ) : undefined
      }
      {
        this.state.namespaces.continuationToken ? (
          <bs.Button bsStyle="primary" onClick={this.nextNamespaces}
                     className="pull-right">
            More namespaces&nbsp;
            <bs.Glyphicon glyph="arrow-right"/>
          </bs.Button>
        ) : undefined
      }
      </span>
    );
  },

  /** Render list of tasks */
  renderTasks: function() {
    return (
      <span>
      <bs.Table condensed hover className="namespace-table">
        <tbody>
          {
            this.state.tasks.tasks.map(function(task, index) {
              var isCurrent = (this.state.current === task.namespace);
              return (
                <tr key={index}>
                  <td onClick={this.setCurrent.bind(this, task.namespace)}
                      className={isCurrent ? 'info' : undefined}>
                    {task.namespace.split('.').pop()}
                  </td>
                </tr>
              );
            }, this)
          }
        </tbody>
      </bs.Table>
      {
        this.state.tasksToken ? (
          <bs.Button bsStyle="primary" onClick={this.clearTasksToken}
                     className="pull-left">
            <bs.Glyphicon glyph="arrow-left"/>&nbsp;
            Back to start
          </bs.Button>
        ) : undefined
      }
      {
        this.state.tasks.continuationToken ? (
          <bs.Button bsStyle="primary" onClick={this.nextTasks}
                     className="pull-right">
            More tasks&nbsp;
            <bs.Glyphicon glyph="arrow-right"/>
          </bs.Button>
        ) : undefined
      }
      </span>
    );
  },

  /** Load next tasks */
  nextTasks: function() {
    this.setState({
      tasksToken:   this.state.tasks.continuationToken
    });
  },

  /** Load next namespaces */
  nextNamespaces: function() {
    this.setState({
      namespaceToken:   this.state.namespaces.continuationToken
    });
  },

  /** Update namespace input field */
  updateNamespaceInput: function() {
    this.setState({namespaceInput: this.state.namespace});
  },

  /** Handle changes in namespace input field */
  handleNamespaceInputChange: function() {
    this.setState({
      namespaceInput:   this.refs.namespace.getInputDOMNode().value
    });
  },

  /** Browse a namespace */
  browse: function(ns) {
    this.setState({
      namespace:      ns,
      current:        ns,
      tasksToken:     undefined,
      namespaceToken: undefined
    });
  },

  /** Set current tasks */
  setCurrent: function(ns) {
    this.setState({
      current:      ns
    });
  },

  /** Load from namespace input field */
  loadNamespaceInput: function(e) {
    if (e) {
      e.preventDefault();
    }
    this.browse(this.state.namespaceInput);
  },

  clearContinuationTokens: function() {
    this.setState({
      tasksToken:     undefined,
      namespaceToken: undefined
    });
  },

  clearNamespaceToken: function() {
    this.setState({
      namespaceToken: undefined
    });
  },

  clearTasksToken: function() {
    this.setState({
      tasksToken:     undefined
    });
  }
});

// Export IndexBrowser
module.exports = IndexBrowser;
