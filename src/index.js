import React from 'react';
import { render } from 'react-dom';
import App from './app';

const load = () => render((
  <App />
), document.getElementById('root'));

load();
