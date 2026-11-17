import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary, setLocalStorageNamespace } from 'common-frontend';
import { servesReference } from './rehearsed-round';

// The reference build shares its origin with the rehearsed one, so it keeps its
// session and saved matches under keys of its own. The rehearsed build keeps the
// historical keys, and with them the sessions testers already have.
if (servesReference) setLocalStorageNamespace('minta-verseny');

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
