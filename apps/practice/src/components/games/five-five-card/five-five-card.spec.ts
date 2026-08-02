import { moves, type Board } from './five-five-card';
import { makeCtx } from '../../../test-utils';

// Each player starts with cards 1..5 and takes from the other until one each is
// left. The player holding the larger card wins on an odd sum, the smaller on
// an even sum, and the starter wins a tie.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// A hand holding exactly the listed values, at their 1-based positions.
const hand = (values: number[]): (number | null)[] =>
  [1, 2, 3, 4, 5].map(v => (values.includes(v) ? v : null));

const board = (first: number[], second: number[]): Board => [hand(first), hand(second)];

describe('end of game', () => {
  it('ends once both players are down to one card, odd sum going to the larger', () => {
    // player 0 takes the 5 from player 1, leaving 3 against 4: sum 7, larger wins
    const outcome = moves.removeCard.apply(board([3], [4, 5]), asPlayer(0), 5);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives an even sum to the smaller card', () => {
    // leaves 3 against 5 -> sum 8, smaller (player 0) wins
    const outcome = moves.removeCard.apply(board([1, 3], [5]), asPlayer(1), 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('gives a tie to the starting player', () => {
    const outcome = moves.removeCard.apply(board([3], [3, 4]), asPlayer(0), 4);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while either player holds more than one card', () => {
    const outcome = moves.removeCard.apply(board([1, 2, 3], [4, 5]), asPlayer(0), 5);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
