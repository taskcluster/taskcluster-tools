import React from 'react';
import { Route } from 'react-router-dom';
import TaskInspector from './taskinspector';
import Layout from '../lib/Layout';

const TaskInspectorView = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:taskId?/:run?/:section?`} render={props => <TaskInspector {...props} />} />
  </Layout>
);

export default TaskInspectorView;
