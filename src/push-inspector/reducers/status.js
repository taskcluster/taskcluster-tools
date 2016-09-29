import { FETCH_STATUS } from '../actions/types';

export default (state = null, action) => action.type === FETCH_STATUS ?
  action.payload :
  state;
