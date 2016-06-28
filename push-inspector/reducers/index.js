import { combineReducers } from 'redux';

import tasksReducer from './tasks';
import taskReducer from './task';
import statusReducer from './status';
import activeTaskStatusReducer from './activeTaskStatus';
import artifactsReducer from './artifacts';
import taskActionMessageReducer from './taskActionMessage';

const rootReducer = combineReducers({
  tasks: tasksReducer,
  task: taskReducer,
  status: statusReducer,
  activeTaskStatus: activeTaskStatusReducer,
  artifacts: artifactsReducer,
  taskActionMessage: taskActionMessageReducer
});

export default rootReducer;
