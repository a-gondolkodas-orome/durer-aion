import { moves, type Board } from './rock-paper-scissor';
import { makeCtx } from '../../../test-utils';

// Both players start with rock, paper and scissors and take cards from each
// other until one each is left; the survivors then play a normal round, with
// ties going to the starting player.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const ROCK = 0, PAPER = 1, SCISSOR = 2;

const hand = (kept: number[]): Board[number] =>
  (['rock', 'paper', 'scissor'] as const).map((s, i) => (kept.includes(i) ? s : null));

const board = (first: number[], second: number[]): Board => [hand(first), hand(second)];

describe('end of game', () => {
  it('ends once both players are down to one card, and the beating card wins', () => {
    // player 1 takes player 0's scissors, leaving rock against scissors
    const outcome = moves.removeSymbol.apply(board([ROCK, SCISSOR], [SCISSOR]), asPlayer(1), SCISSOR);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the round to the second player when their card beats the first', () => {
    // leaves rock against paper: paper (player 1) wins
    const outcome = moves.removeSymbol.apply(board([ROCK], [PAPER, ROCK]), asPlayer(0), ROCK);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while either player holds more than one card', () => {
    const outcome = moves.removeSymbol.apply(board([ROCK, PAPER, SCISSOR], [ROCK, PAPER]), asPlayer(0), PAPER);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
