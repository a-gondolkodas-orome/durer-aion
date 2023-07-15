import { render, screen } from '@testing-library/react';
import { gameWrapper } from './gamewrapper';
import { RecoilRoot } from 'recoil';
import { GameStateMixin, GameType } from './types';
import { Ctx, DefaultPluginAPIs } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { createGame, createGameWithMove } from './game_for_testing';

type G = { data: string };

describe('gameWrapper', () => {
  const setup = jest.fn();

  const move = jest.fn();
  const startingPosition = jest.fn();
  const wrappedGame = gameWrapper(createGameWithMove(setup, startingPosition, move));

  beforeEach(() => {
    jest.resetAllMocks();

    setup.mockReturnValue({ data: "setup" });
    startingPosition.mockReturnValue({ data: "startingPosition" });
  });

  test('whether client calls into wrapped setup', () => {
    Client({ game: wrappedGame, numPlayers: 2 });
    expect(setup).toBeCalled();
  });

  test('whether default state is consistent', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.data).toStrictEqual("setup");
  });

  test('chooseNewGameType', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();

    client.moves.chooseNewGameType("live");
    client.moves.setStartingPosition({ data: "startingPosition" });

    expect(client.getState()?.ctx.phase).toStrictEqual("chooseRole");
    expect(client.getState()?.G.data).toStrictEqual("startingPosition");
  });

  test('chooseRole', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });

    client.moves.chooseRole('0');
    expect(client.getState()?.ctx.phase).toStrictEqual("play");

  });

  test('move', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    move.mockImplementation(({ G }, newData) => {
      return {
        ...G, data: newData
      }
    });
    client.moves.move("move");

    expect(move).toBeCalled();
    expect(client.getState()?.G.data).toStrictEqual("move");
  });
});

describe('gameWrapper high-level logic', () => {
  const setup = () => ({ data: "asd" });
  const startingPosition = jest.fn();
  const wrappedGame = gameWrapper(createGame(setup, startingPosition));

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('win once', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    client.moves.win();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(1);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(1);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });

  test('lose once', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    client.moves.lose();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(1);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(1);
    expect(client.getState()?.G.winningStreak).toStrictEqual(0);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });

  test('win twice', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    client.moves.win();

    client.moves.chooseNewGameType('live');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    client.moves.win();

    console.log(client.getState());

    expect(client.getState()?.ctx.phase).toStrictEqual(null);
    expect(client.getState()?.G.numberOfTries).toStrictEqual(2);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(2);
    expect(client.getState()?.G.points).toStrictEqual(12);
  });

  test('win in test', () => {
    const client = Client({ game: wrappedGame, numPlayers: 2 });
    client.start();
    client.moves.chooseNewGameType('test');
    client.moves.setStartingPosition({ data: "startingPosition" });
    client.moves.chooseRole('0');

    client.moves.lose();

    expect(client.getState()?.ctx.phase).toStrictEqual("startNewGame");
    expect(client.getState()?.G.numberOfTries).toStrictEqual(0);
    expect(client.getState()?.G.numberOfLoss).toStrictEqual(0);
    expect(client.getState()?.G.winningStreak).toStrictEqual(0);
    expect(client.getState()?.G.points).toStrictEqual(0);
  });
});
