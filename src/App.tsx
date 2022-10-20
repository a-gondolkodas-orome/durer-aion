import React, { useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import './App.css';
import { Link } from 'react-router-dom';
import { teamData } from './teamData';


function App() {

const inputEl = useRef<HTMLInputElement>(null);
const navigate = useNavigate()

const codesC = ["111-1111-111"]
const codesD = ["222-2222-222"]
const codesE = ["333-3333-333"]

const onClick = () => {
  // read input value
  const inputValue = inputEl.current!.value;
  //team data:
  const team = teamData.find(t => t.join_code==inputValue)
  if(team?.category == 'C'){
    navigate('/relay-c')
  } else if (team?.category == 'D'){
    navigate('/relay-d')
  } else if (team?.category == 'E'){
    navigate('/relay-e')
  } else {
    alert("Nem megfelelő kód!")
  }
  inputEl.current!.value = '';
};

  return (
    <div>
      <Link to="/tictactoe">Tic Tac Toe</Link><br />
      <Link to="/tictactoe-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/superstitious-counting">Superstitious counting</Link><br />
      <Link to="/superstitious-counting-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/chess-bishops">Chess bishops</Link><br />
      <Link to="/chess-bishops-with-bot">Tic Tac Toe (with bot)</Link><br />
      <Link to="/relay-c">Relay-c</Link><br />
      <Link to="/relay-d">Relay-d</Link><br />
      <Link to="/relay-e">Relay-e</Link><br />
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
      <label htmlFor="login"> Kód: </label>
      <input ref={inputEl} id="login" type="text" className="border-2" />
      <button
            className="cta-button" onClick={() => onClick()}
            >Bejelentkezés</button>
    </div>
  );
}

export default App;
