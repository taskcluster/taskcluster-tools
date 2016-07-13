import {
  FETCH_ARTIFACTS
} from '../actions/types';

export default function(state = [], action) {
  switch(action.type) {
    case FETCH_ARTIFACTS:
      return action.payload;
  }
  return state;
}
