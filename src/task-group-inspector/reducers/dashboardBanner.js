import {SET_DASHBOARD_BANNER} from '../actions/types';

export default (state = false, action) => action.type === SET_DASHBOARD_BANNER ?
  action.payload :
  state;
