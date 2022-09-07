import React from 'react';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <Link to="/tictactoe">Tic Tac Toe</Link><br />
      <Link to="/tictactoe-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/superstitious-counting">Superstitious counting</Link><br />
      <Link to="/superstitious-counting-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/chess-bishops">Chess bishops</Link><br />
      <Link to="/chess-bishops-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/lobby">Lobby (needs running server: <pre>npm run dev:server</pre></Link><br />
    </div>
  );
}

export default App;
