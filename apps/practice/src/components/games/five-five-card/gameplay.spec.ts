import { CARDS, moves, type Board, type Card } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// `mover` is whose turn it is; the card it names comes from the *other* hand.
const isRemovalAllowed = (board: Board, mover: number, card: Card): boolean =>
  moveValidator(moves.removeCard, asPlayer(mover).ctx)(board, card);

describe('isRemovalAllowed', () => {
  const table: Board = [[1, 2, 4, 5], [1, 2, 3, 4, 5]];

  it('allows taking a card the other player still holds', () => {
    expect(CARDS.every(card => isRemovalAllowed(table, 0, card))).toBe(true);
  });

  it('rejects a card the other player has already lost', () => {
    expect(isRemovalAllowed(table, 1, 3)).toBe(false);
    expect(isRemovalAllowed(table, 1, 2)).toBe(true);
  });

  // The engine validates whatever a stray dispatch passed, so a number that was
  // never dealt has to be rejected rather than quietly missing every hand.
  it('rejects a number the game does not deal, including the 0 of 0-based indexing', () => {
    expect(isRemovalAllowed(table, 0, 0 as Card)).toBe(false);
    expect(isRemovalAllowed(table, 0, 6 as Card)).toBe(false);
  });
});

// Each player starts with cards 1..5 and takes from the other until one each is
// left. The player holding the larger card wins on an odd sum, the smaller on
// an even sum, and the starter wins a tie.
describe('end of game', () => {
  it('ends once both players are down to one card, odd sum going to the larger', () => {
    // player 0 takes the 5 from player 1, leaving 3 against 4: sum 7, larger wins
    const outcome = moves.removeCard.apply([[3], [4, 5]], asPlayer(0), 5);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives an even sum to the smaller card', () => {
    // leaves 3 against 5 -> sum 8, smaller (player 0) wins
    const outcome = moves.removeCard.apply([[1, 3], [5]], asPlayer(1), 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('gives a tie to the starting player', () => {
    const outcome = moves.removeCard.apply([[3], [3, 4]], asPlayer(0), 4);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while either player holds more than one card', () => {
    const outcome = moves.removeCard.apply([[1, 2, 3], [4, 5]], asPlayer(0), 5);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
