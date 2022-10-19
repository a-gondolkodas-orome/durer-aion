import { TeamModelDto } from '../../dto/TeamStateDto';
import { FinishedRelay } from './FinishedRelay';
import { InProgressRelay } from './InProgressRelay';
import { GameRelay } from '../../../games/relay/game';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import botWrapper from '../../../common/botwrapper';
import { strategy } from '../../../games/relay/strategy';

export function Relay(props: {state: TeamModelDto}) {
  switch (props.state.relayMatch.state) {
    case "FINISHED":
      return (
        <FinishedRelay state={props.state}/>
      )
    case "IN PROGRESS":
      switch(props.state.category) {
        case "C": 
          return (
            // TODO ADD PROPER MATCH ID
            <RelayClient_C playerID={"0"} /*matchID={props.state.relayMatch.matchID}*//>
          )
        case "D": 
          return (
            <RelayClient_D playerID={"0"} /*matchID={props.state.relayMatch.matchID}*//>
          )
        case "E": 
          return (
            <RelayClient_E playerID={"0"} /*matchID={props.state.relayMatch.matchID}*//>
          )
        default: return <>NO CATEGORY</>;
      }
    case "NOT STARTED":
    default: return <>UNSUPPORTED STATE</>;
  }
}

const RelayClient_C = Client({
  game: GameRelay,
  board: InProgressRelay,
  numPlayers: 2,
  multiplayer: Local(
    {
      bots: { '1': botWrapper(strategy("C")) }
    }
  ),
});
const RelayClient_D = Client({
  game: GameRelay,
  board: InProgressRelay,
  numPlayers: 2,
  multiplayer: Local(
    {
      bots: { '1': botWrapper(strategy("D")) }
    }
  ),
});
const RelayClient_E = Client({
  game: GameRelay,
  board: InProgressRelay,
  numPlayers: 2,
  multiplayer: Local(
    {
      bots: { '1': botWrapper(strategy("E")) }
    }
  ),
});