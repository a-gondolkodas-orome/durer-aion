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
      <Link to="/relay">Relay</Link><br />
      Game 14 online C: <Link to="/game-14-online-c">offline</Link>, <Link to="/game-14-online-c-with-bot">with bot</Link><br />
      Game 14 online D: <Link to="/game-14-online-d">offline</Link>, <Link to="/game-14-online-d-with-bot">with bot</Link><br />
      Game 14 online e: <Link to="/game-14-online-e">offline</Link>, <Link to="/game-14-online-e-with-bot">with bot</Link><br />
      Game 15 online C: <Link to="/game-15-online-c">offline</Link>, <Link to="/game-15-online-c-with-bot">with bot</Link><br />
      Game 15 online D: <Link to="/game-15-online-d">offline</Link>, <Link to="/game-15-online-d-with-bot">with bot</Link><br />
      Game 15 online e: <Link to="/game-15-online-e">offline</Link>, <Link to="/game-15-online-e-with-bot">with bot</Link><br />
      Ten coins: <Link to="/ten-coins">offline</Link>, <Link to="/ten-coins-with-bot">with bot</Link><br />
      <Link to="/lobby">Lobby (needs running server: <pre>npm run dev:server</pre></Link><br />
    </div>
  );
}

export default App;
