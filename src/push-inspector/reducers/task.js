import { FETCH_TASK } from '../actions/types';

export default (state = null, action) => action.type === FETCH_TASK ?
  action.payload :
  state;
