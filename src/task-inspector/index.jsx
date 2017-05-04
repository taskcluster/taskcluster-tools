import React from 'react';
import TaskInspector from './taskinspector';
import Layout from '../lib/Layout';
import {Route} from 'react-router-dom';

const TaskInspectorView = ({match}) => {
  return (
    <Layout>
      <Route path={`${match.url}/:taskId?/:run?/:section?`} render={(props) => <TaskInspector {...props} />} />
    </Layout>
  );
};

export default TaskInspectorView;
