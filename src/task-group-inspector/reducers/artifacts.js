import {FETCH_ARTIFACTS} from '../actions/types';

export default (state = [], action) => action.type === FETCH_ARTIFACTS ?
  action.payload :
  state;
