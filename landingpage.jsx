var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var menu                    = require('./menu');
var format                  = require('./lib/format');

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

  React.render(
    (
      <div className="landingpage-entries">
        <bs.Row>
          <bs.Col md={12}>
            <bs.Well className="landingpage-well">
              <img src="/lib/assets/taskcluster-120.png"
                   className="landingpage-image"/>
              <h2>Welcome to TaskCluster Tools,</h2>
              A collection of tools for TaskCluster components and elements in
              the TaskCluster eco-system. Here you'll find tools to manage
              TaskCluster as well as run, debug, inspect and view tasks,
              task-graphs, and other TaskCluster related entities.
            </bs.Well>
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


