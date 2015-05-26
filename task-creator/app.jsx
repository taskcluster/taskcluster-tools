var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var TaskCreator             = require('./taskcreator');

// Initial task, if nothing is stored in localStorage
var initialTask = {
  provisionerId:      'aws-provisioner-v1',
  workerType:         'b2gtest',
  created:            null, // later
  deadline:           null, // later
  payload: {
    image:            'ubuntu:13.10',
    command:          ['/bin/bash', '-c', 'echo "hello World"'],
    maxRunTime:       60 * 10
  },
  metadata: {
    name:             "Example Task",
    description:      "Markdown description of **what** this task does",
    owner:            "name@example.com",
    source:           "http://tools.taskcluster.net/task-creator/"
  }
};

// Render component
$(function() {
  React.render(
    (
      <bs.Row style={{marginBottom: 50}}>
        <TaskCreator
          localStorageKey="task-creator/task"
          initialTaskValue={JSON.stringify(initialTask, null, '\t')}/>
      </bs.Row>
    ),
    $('#container')[0]
  );
});

