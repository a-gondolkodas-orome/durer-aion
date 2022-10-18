import { GameRelay } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';
import { Client } from 'boardgame.io/react';
import { Debug } from 'boardgame.io/debug';
import { Local } from 'boardgame.io/multiplayer';
import botWrapper from '../../common/botwrapper';

let description = <p className="text-justify">
</p>

const Relay_C = Client({
  game: GameRelay,
  board: MyBoard,
  numPlayers: 2,
  debug: { impl: Debug },
  multiplayer: Local(
    {
      bots: { '1': botWrapper(strategy("C")) }
    }
  ),
});


export default function () {
  return (
    <>
      <Relay_C playerID='0' />
    </>
  );
};
