import 'babel-polyfill';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import App from './App';

const root = document.getElementById('root');
const load = () =>
  render(
    <AppContainer warnings={false}>
      <App />
    </AppContainer>,
    root
  );

if (module.hot) {
  module.hot.accept('./App', load);
}

load();
