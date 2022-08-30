import React from 'react';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <Link to="/tictactoe">Tic Tac Toe</Link><br />
      <Link to="/tictactoe2">Tic Tac Toe</Link><br />
      <Link to="/superstitious-counting">Superstitious counting</Link><br />
      <Link to="/chess-bishops">Chess bishops</Link><br />
      <Link to="/game-14-online-c">Game 14 online C</Link><br />
      <Link to="/lobby">Lobby (needs running server: <pre>npm run dev:server</pre></Link><br />
    </div>
  );
}

export default App;
