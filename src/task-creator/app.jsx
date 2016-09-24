import React from 'react';
import ReactDOM from 'react-dom';
import { Row } from 'react-bootstrap';
import TaskCreator from './taskcreator';
import Layout from '../lib/Layout';

// Initial task, if nothing is stored in localStorage
const initialTask = {
  provisionerId: 'aws-provisioner-v1',
  workerType: 'tutorial',
  created: null, // later
  deadline: null, // later
  payload: {
    image: 'ubuntu:13.10',
    command: ['/bin/bash', '-c', 'echo "hello World"'],
    maxRunTime: 60 * 10
  },
  metadata: {
    name: 'Example Task',
    description: 'Markdown description of **what** this task does',
    owner: 'name@example.com',
    source: 'https://tools.taskcluster.net/task-creator/'
  }
};

ReactDOM.render((
  <Layout>
    <Row style={{ marginBottom: 50 }}>
      <TaskCreator
        localStorageKey="task-creator/task"
        initialTaskValue={JSON.stringify(initialTask, null, '\t')}/>
    </Row>
  </Layout>
), document.getElementById('root'));
