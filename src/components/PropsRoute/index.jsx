import { createElement } from 'react';
import { Route } from 'react-router-dom';

const PropsRoute = ({ component, render, ...props }) => (
  <Route
    {...props}
    render={routeProps =>
      createElement(component, Object.assign({}, routeProps, props))
    }
  />
);

export default PropsRoute;
