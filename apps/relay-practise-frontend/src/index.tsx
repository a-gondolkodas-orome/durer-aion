import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary, setLocalStorageNamespace } from 'common-frontend';
import i18next from 'i18next';
import { openInPreferredLanguage } from './language';

// This app shares its origin (gyakorlo.durerinfo.hu) with the offline dry run.
setLocalStorageNamespace('relay-practise');
void openInPreferredLanguage(i18next);
const root = document.getElementById('root');
if (!root) throw new Error('Root container not found');
ReactDOM.createRoot(root).render((
  <React.StrictMode>
    {/* The last resort, for a crash outside the screen `App` already guards */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
));
