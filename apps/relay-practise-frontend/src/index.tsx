import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary, setLocalStorageNamespace } from 'common-frontend';
import i18next from 'i18next';
import { openInPreferredLanguage } from './language';

import * as Sentry from "@sentry/react";

// This app shares its origin (gyakorlo.durerinfo.hu) with the offline dry run.
setLocalStorageNamespace('relay-practise');

// Reporting is opt-in per build — see *Error reporting* in README.md.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],

    // Error reports matter here; performance traces from a public practice site
    // do not need full sampling.
    tracesSampleRate: 0.1,
  });
}
// After Sentry, so a storage read that throws is reported.
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
