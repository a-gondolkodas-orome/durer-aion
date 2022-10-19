import React from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import { Main } from './components/Main';
import { RecoilRoot } from 'recoil';

function App() {

  return (
    <Main />
  )
  /*
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
      Ten coins C: <Link to="/ten-coins-c">offline</Link>, <Link to="/ten-coins-with-bot-c">with bot</Link><br />
      Ten coins D: <Link to="/ten-coins-d">offline</Link>, <Link to="/ten-coins-with-bot-d">with bot</Link><br />
      Ten coins E: <Link to="/ten-coins-e">offline</Link>, <Link to="/ten-coins-with-bot-e">with bot</Link><br />
      <Link to="/lobby">Lobby (needs running server: <pre>npm run dev:server</pre></Link><br />
    </div>
  );*/
}

export default App;
