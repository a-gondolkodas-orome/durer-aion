import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import TicTacToe from './games/tictactoe/main';
import SuperstitiousCounting from './games/superstitious-counting/main';
import ChessBishops from './games/chess-bishops/main';
import Lobby from './lobby';

const root = document.getElementById('root');
render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/superstitious-counting" element={<SuperstitiousCounting />} />
        <Route path="/chess-bishops" element={<ChessBishops />} />
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
