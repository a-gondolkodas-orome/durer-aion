import { isRemovalAllowed, moves, type Board } from './gameplay';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const ROCK = 0, PAPER = 1, SCISSOR = 2;

const hand = (kept: number[]): Board[number] =>
  (['rock', 'paper', 'scissor'] as const).map((s, i) => (kept.includes(i) ? s : null));

const board = (first: number[], second: number[]): Board => [hand(first), hand(second)];

describe('isRemovalAllowed', () => {
  const table = board([ROCK, SCISSOR], [ROCK, PAPER, SCISSOR]);

  it('allows taking a symbol the other player still holds', () => {
    expect([0, 1, 2].every(idx => isRemovalAllowed(table, 1, idx))).toBe(true);
  });

  it('rejects a symbol the other player has already lost', () => {
    expect(isRemovalAllowed(table, 0, PAPER)).toBe(false);
    expect(isRemovalAllowed(table, 0, ROCK)).toBe(true);
  });

  it('rejects a symbol that does not exist', () => {
    expect(isRemovalAllowed(table, 1, 3)).toBe(false);
    expect(isRemovalAllowed(table, 1, -1)).toBe(false);
  });
});

// Both players start with rock, paper and scissors and take cards from each
// other until one each is left; the survivors then play a normal round, with
// ties going to the starting player.
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

  it.each([
    ['rock', ROCK],
    ['paper', PAPER],
    ['scissor', SCISSOR]
  ])('gives two %s cards to the starting player', (_name, symbol) => {
    // player 1 takes player 0's spare card, leaving the same symbol on both sides
    const spare = (symbol + 1) % 3;
    const outcome = moves.removeSymbol.apply(board([symbol, spare], [symbol]), asPlayer(1), spare);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while either player holds more than one card', () => {
    const outcome = moves.removeSymbol.apply(board([ROCK, PAPER, SCISSOR], [ROCK, PAPER]), asPlayer(0), PAPER);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
