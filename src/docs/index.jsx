import { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import NotFound from '../components/NotFound';
import Doc from './Doc';

export default class Documentation extends Component {
  render() {
    const { match, location } = this.props;
    const { path } = match;

    if (location.pathname.endsWith('/')) {
      return (
        <Redirect
          replace
          to={location.pathname.slice(0, location.pathname.length - 1)}
        />
      );
    }

    return (
      <Switch>
        <Route path={`${path}/tutorial/:doc?`} component={Doc} />
        <Route component={NotFound} />
      </Switch>
    );
  }
}
