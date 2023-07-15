import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Route, Routes, HashRouter } from 'react-router-dom';

import NotFound from './pages/NotFound';
import { RecoilRoot } from 'recoil';

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  // TODO: DSN only works when we give sentry to the people...
  dsn: "https://c94695b2ab564e258774e5d0e5c97d79@sentry.durerinfo.hu/2",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const root = document.getElementById('root');
render(
  <React.StrictMode>
    <RecoilRoot>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path='*' element={<NotFound/>}></Route>
        </Routes>
      </HashRouter>
    </RecoilRoot>
  </React.StrictMode>,
  root
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
