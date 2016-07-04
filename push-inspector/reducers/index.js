import { combineReducers } from 'redux';

import tasksReducer from './tasks';
import taskReducer from './task';
import statusReducer from './status';
import activeTaskStatusReducer from './activeTaskStatus';
import artifactsReducer from './artifacts';
import taskActionMessageReducer from './taskActionMessage';
import taskActionInProgressReducer from './taskActionInProgress';
import dashboardBannerReducer from './dashboardBanner';
import tasksNotAvailableReducer from './tasksNotAvailable';
import tasksRetrievedFullyReducer from './tasksRetrievedFully';

const rootReducer = combineReducers({
  tasks: tasksReducer,
  tasksNotAvailable: tasksNotAvailableReducer,
  task: taskReducer,
  status: statusReducer,
  activeTaskStatus: activeTaskStatusReducer,
  artifacts: artifactsReducer,
  taskActionMessage: taskActionMessageReducer,
  taskActionInProgress: taskActionInProgressReducer,
  dashboardBanner: dashboardBannerReducer,
  tasksRetrievedFully: tasksRetrievedFullyReducer

});

export default rootReducer;
