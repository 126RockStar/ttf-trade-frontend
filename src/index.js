import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { store } from 'store';
import { Provider } from 'react-redux';
import App from 'App.jsx';
import './index.scss';

const root = createRoot(document.getElementById('root'))

root.render(
  <Provider store={store}>
    <Router>
      <Route>
        <App />
      </Route>
    </Router>
  </Provider>
)
