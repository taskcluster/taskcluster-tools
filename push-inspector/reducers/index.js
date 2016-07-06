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
  
  // List of tasks
  tasks: tasksReducer,

  // Boolean set when the result of the first call to listTaskGroup has returned
  // so that the global loading screen is removed
  tasksNotAvailable: tasksNotAvailableReducer,

  // The task property of a "task"
  task: taskReducer,

  // The status property of a "task"
  status: statusReducer,

  // The active state to filter
  activeTaskStatus: activeTaskStatusReducer,

  // The list of artifacts of a task
  artifacts: artifactsReducer,

  // The message to show when one of the action buttons are called
  taskActionMessage: taskActionMessageReducer,

  // Boolean saying whether the action button call is still executing
  taskActionInProgress: taskActionInProgressReducer,

  // Boolean saying whether to show the dashboard banner or not
  dashboardBanner: dashboardBannerReducer,

  // Boolean saying that the full list of tasks has been retrieved i.e., no more tokens
  tasksRetrievedFully: tasksRetrievedFullyReducer

});

export default rootReducer;
