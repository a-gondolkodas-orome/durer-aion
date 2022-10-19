import { GameRelay } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';
import { Client } from 'boardgame.io/react';
import { Debug } from 'boardgame.io/debug';
import { Local } from 'boardgame.io/multiplayer';
import botWrapper from '../../common/botwrapper';
import { ClientFactoryRelay } from '../../common/client_factory';

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

export const { Client:RelayClient_C, ClientWithBot:RelayClientWithBot_C, OnlineClient:RelayOnlineClient_C } = ClientFactoryRelay(GameRelay, MyBoard, strategy("C"), description);
export const { Client:RelayClient_D, ClientWithBot:RelayClientWithBot_D, OnlineClient:RelayOnlineClient_D } = ClientFactoryRelay(GameRelay, MyBoard, strategy("D"), description);
export const { Client:RelayClient_E, ClientWithBot:RelayClientWithBot_E, OnlineClient:RelayOnlineClient_E } = ClientFactoryRelay(GameRelay, MyBoard, strategy("E"), description);

export default function () {
  return (
    <>
      <Relay_C playerID='0' />
    </>
  );
};
