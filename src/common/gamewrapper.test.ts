import { render, screen } from '@testing-library/react';
import { gameWrapper } from './gamewrapper';
import { RecoilRoot } from 'recoil';
import { GameStateMixin, GameType } from './types';
import { Ctx, DefaultPluginAPIs } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { createGameWithMove } from './game_for_testing';

type G = { data: string };

beforeEach(()=>{
  jest.resetAllMocks();
});

it('gameWrapper', () => {
  const setup = jest.fn();
  const move = jest.fn();
  const startingPosition = jest.fn();

  setup.mockReturnValue({ data: "asd" });
  let wrappedGame = gameWrapper(createGameWithMove(setup, startingPosition, move));

  const client = Client({ game: wrappedGame, numPlayers: 2 });
  expect(setup).toBeCalled();

  client.start();

  expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
  expect(client.getState()?.G.data).toStrictEqual("asd");

  client.moves.chooseNewGameType('live');
  expect(client.getState()?.ctx.phase).toStrictEqual("chooseRole");

  client.moves.chooseRole('0');
  expect(client.getState()?.ctx.phase).toStrictEqual("play");

  move.mockImplementation(({G}, newData) => {
    return {
      ...G, data: newData
    }
  });
  client.moves.move("fgh");

  expect(move).toBeCalled();
  expect(client.getState()?.G.data).toStrictEqual("fgh");
});
