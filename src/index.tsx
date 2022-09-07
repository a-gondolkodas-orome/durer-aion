import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { Client as TicTacToeClient, ClientWithBot as TicTacToeWithBotClient } from './games/tictactoe/main';
import { Client as SuperstitiousCountingClient, ClientWithBot as SuperstitiousCountingWithBotClient } from './games/superstitious-counting/main';
import { Client as ChessBishopsClient, ClientWithBot as ChessBishopsWithBotClient } from './games/chess-bishops/main';
import Lobby from './lobby';

const root = document.getElementById('root');
render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tictactoe" element={<TicTacToeClient />} />
        <Route path="/tictactoe-with-bot" element={<TicTacToeWithBotClient />} />
        <Route path="/superstitious-counting" element={<SuperstitiousCountingClient />} />
        <Route path="/superstitious-counting-with-bot" element={<SuperstitiousCountingWithBotClient />} />
        <Route path="/chess-bishops" element={<ChessBishopsClient />} />
        <Route path="/chess-bishops-with-bot" element={<ChessBishopsWithBotClient />} />
        <Route path="/lobby" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  root
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
