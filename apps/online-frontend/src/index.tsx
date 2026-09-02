import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import * as Sentry from "@sentry/react";

// Reporting is opt-in per build — see *Error reporting* in README.md.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}
const root = document.getElementById('root');
if (!root) throw new Error('Root container not found');

ReactDOM.createRoot(root).render((
  <React.StrictMode>
      <App />
  </React.StrictMode>
));
