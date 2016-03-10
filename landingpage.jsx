let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let bs                      = require('react-bootstrap');
let menu                    = require('./menu');
let format                  = require('./lib/format');

/** Split an array into chunks */
var chunks = function(array, size) {
  var results = [];
  while (array.length) {
    results.push(array.splice(0, size));
  }
  return results;
};

// Render component
$(function() {
  var entries = menu.filter(function(entry) {
    return entry.type !== 'divider' && entry.display;
  }).map(function(entry, index) {
    return (
      <bs.Col md={4} sm={6} key={index}>
        <a href={entry.link} className="landingpage-entry">
          <h4>{entry.title}</h4>
          <format.Icon  name={entry.icon || 'wrench'}
                        size="3x"
                        className="pull-left"
                        style={{padding: '.2em .25em .15em'}}/>
          <format.Markdown>{entry.description}</format.Markdown>
        </a>
      </bs.Col>
    );
  });

  ReactDOM.render(
    (
      <div className="landingpage-entries">
        <bs.Row>
          <bs.Col md={8} mdOffset={2} sm={10} smOffset={1}>
            <div className="landingpage-header">
              <img src={"/lib/assets/taskcluster-180.png"}/>
              <h2><span className="light-font">Welcome to</span> <span className="landingpage-logo">TaskCluster Tools</span></h2>
            </div>
          </bs.Col>
        </bs.Row>
        <bs.Row className="landingpage-description">
          <bs.Col sm={12}>
            <p>
              A collection of tools for TaskCluster components and elements in the TaskCluster eco-system. Here you'll find tools to manage TaskCluster as well as run, debug, inspect and view tasks, task-graphs, and other TaskCluster related entities.
            </p>
          </bs.Col>
        </bs.Row>
      {
        chunks(entries, 3).map(function(cols, index) {
          return (
            <bs.Row key={index}>
            {cols}
            </bs.Row>
          );
        })
      }
      </div>
    ),
    $('#container')[0]
  );
});
