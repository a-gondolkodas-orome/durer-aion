import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { reportWebVitals, setLocalStorageNamespace } from 'common-frontend';

import * as Sentry from "@sentry/react";

// This app shares its origin (gyakorlo.durerinfo.hu) with the offline dry run.
setLocalStorageNamespace('relay-practise');

Sentry.init({
  // TODO: DSN only works when we give sentry to the people...
  dsn: "https://c94695b2ab564e258774e5d0e5c97d79@sentry.durerinfo.hu/2",
  integrations: [Sentry.browserTracingIntegration()],

  // Error reports matter here; performance traces from a public practice site
  // do not need full sampling.
  tracesSampleRate: 0.1,
});
const root = document.getElementById('root');
if (!root) throw new Error('Root container not found');
ReactDOM.createRoot(root).render((
  <React.StrictMode>
      <App />
  </React.StrictMode>
));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
