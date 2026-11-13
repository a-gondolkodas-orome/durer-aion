import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from 'common-frontend';
import { tracker } from './tracking';

const root = document.getElementById('root');
if (!root) throw new Error('Root container not found');

ReactDOM.createRoot(root).render((
  <React.StrictMode>
    {/* The last resort, for a crash outside the screen `Main` already guards */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
));

tracker.load();
