import { smartBotStrategy } from "./bot-strategy";
import { botNextMoveArgs, makeCtx } from '../../../test-utils';
import type { Board } from './gameplay';

const smartBotRemoval = (board: Board, currentPlayer: number): number =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer }) }))[0];

describe('smartBotStrategy', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', null, 'scissor']], 1)
    ).toEqual(0);
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', 'paper', null]], 1)
    ).toEqual(1);
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], [null, 'paper', 'scissor']], 1)
    ).toEqual(2);
  });

  it('as a second player remove useless piece in second step', () => {
    expect(
      smartBotRemoval([[null, 'paper', 'scissor'], [null, null, 'scissor']], 1)
    ).toEqual(2);
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(
      smartBotRemoval([['rock', null, 'scissor'], ['rock', null, 'scissor']], 0)
    ).toEqual(0);
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(
      smartBotRemoval([['rock', 'paper', null], ['rock', null, 'scissor']], 0)
    ).toEqual(2);
  });
});
