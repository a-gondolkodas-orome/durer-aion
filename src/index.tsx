import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Route, Routes, HashRouter } from 'react-router-dom';
import { Client as TicTacToeClient, ClientWithBot as TicTacToeWithBotClient } from './games/tictactoe/main';
import { Client as SuperstitiousCountingClient, ClientWithBot as SuperstitiousCountingWithBotClient } from './games/superstitious-counting/main';
import { Client as ChessBishopsClient, ClientWithBot as ChessBishopsWithBotClient } from './games/chess-bishops/main';
import { RelayClientWithBot_C, RelayClientWithBot_D, RelayClientWithBot_E } from './games/relay/main';
import { Client as Game14OnlineCClient, ClientWithBot as Game14OnlineCWithBotClient } from './games/14oc/main';
import { Client as Game14OnlineDClient, ClientWithBot as Game14OnlineDWithBotClient } from './games/14od/main';
import { Client as Game14OnlineEClient, ClientWithBot as Game14OnlineEWithBotClient } from './games/14oe/main';
import { Client as Game15OnlineCClient, ClientWithBot as Game15OnlineCWithBotClient } from './games/15oc/main';
import { Client as Game15OnlineDClient, ClientWithBot as Game15OnlineDWithBotClient } from './games/15od/main';
import { Client as Game15OnlineEClient, ClientWithBot as Game15OnlineEWithBotClient } from './games/15oe/main';
import { Client_C as TenCoinsClient_C, ClientWithBot_C as TenCoinsWithBotClient_C} from './games/ten-coins/main';
import { Client_D as TenCoinsClient_D, ClientWithBot_D as TenCoinsWithBotClient_D} from './games/ten-coins/main';
import { Client_E as TenCoinsClient_E, ClientWithBot_E as TenCoinsWithBotClient_E} from './games/ten-coins/main';
import Lobby from './lobby';
import NotFound from './pages/NotFound';
import { RecoilRoot } from 'recoil';
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  // TODO DSN only works when we give sentry to the people...
  dsn: "https://c94695b2ab564e258774e5d0e5c97d79@sentry.durerinfo.hu/2",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  // TODO DSN only works when we give sentry to the people...
  dsn: "https://464851dbe21e4d428d9fc9c8720f3310@sentry.durerinfo.hu/5",
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
    <HashRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<App />} />
          {/*
        <Route path="/tictactoe" element={<TicTacToeClient />} />
        <Route path="/tictactoe-with-bot" element={<TicTacToeWithBotClient />} />
        <Route path="/superstitious-counting" element={<SuperstitiousCountingClient />} />
        <Route path="/superstitious-counting-with-bot" element={<SuperstitiousCountingWithBotClient />} />
        <Route path="/chess-bishops" element={<ChessBishopsClient />} />
        <Route path="/chess-bishops-with-bot" element={<ChessBishopsWithBotClient />} />
        <Route path="/relay-c" element={<RelayClientWithBot_C />} />
        <Route path="/relay-d" element={<RelayClientWithBot_D />} />
        <Route path="/relay-e" element={<RelayClientWithBot_E />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game-14-online-c" element={<Game14OnlineCClient />} />
        <Route path="/game-14-online-c-with-bot" element={<Game14OnlineCWithBotClient />} />
        <Route path="/game-14-online-d" element={<Game14OnlineDClient />} />
        <Route path="/game-14-online-d-with-bot" element={<Game14OnlineDWithBotClient />} />
        <Route path="/game-14-online-e" element={<Game14OnlineEClient />} />
        <Route path="/game-14-online-e-with-bot" element={<Game14OnlineEWithBotClient />} />
        <Route path="/game-15-online-c" element={<Game15OnlineCClient />} />
        <Route path="/game-15-online-c-with-bot" element={<Game15OnlineCWithBotClient />} />
        <Route path="/game-15-online-d" element={<Game15OnlineDClient />} />
        <Route path="/game-15-online-d-with-bot" element={<Game15OnlineDWithBotClient />} />
        <Route path="/game-15-online-e" element={<Game15OnlineEClient />} />
        <Route path="/game-15-online-e-with-bot" element={<Game15OnlineEWithBotClient />} />
        <Route path="/ten-coins-c" element={<TenCoinsClient_C />} />
        <Route path="/ten-coins-with-bot-c" element={<TenCoinsWithBotClient_C />} />
        <Route path="/ten-coins-d" element={<TenCoinsClient_D />} />
        <Route path="/ten-coins-with-bot-d" element={<TenCoinsWithBotClient_D />} />
        <Route path="/ten-coins-e" element={<TenCoinsClient_E />} />
        <Route path="/ten-coins-with-bot-e" element={<TenCoinsWithBotClient_E />} />
        */}
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
//reportWebVitals();
