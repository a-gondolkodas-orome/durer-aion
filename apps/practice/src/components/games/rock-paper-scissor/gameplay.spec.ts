import { CARDS, moves, type Board, type Card } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// `mover` is whose turn it is; the card it names comes from the *other* hand.
const isRemovalAllowed = (board: Board, mover: number, card: Card): boolean =>
  moveValidator(moves.removeCard, asPlayer(mover).ctx)(board, card);

describe('isRemovalAllowed', () => {
  const table: Board = [['rock', 'scissor'], ['rock', 'paper', 'scissor']];

  it('allows taking a card the other player still holds', () => {
    expect(CARDS.every(card => isRemovalAllowed(table, 0, card))).toBe(true);
  });

  it('rejects a card the other player has already lost', () => {
    expect(isRemovalAllowed(table, 1, 'paper')).toBe(false);
    expect(isRemovalAllowed(table, 1, 'rock')).toBe(true);
  });

  // The engine validates whatever a stray dispatch passed, so a card that is not
  // in the game has to be rejected rather than quietly missing every hand.
  it('rejects a card the game does not have', () => {
    expect(isRemovalAllowed(table, 0, 'lizard' as Card)).toBe(false);
  });
});

// Both players start with rock, paper and scissors and take cards from each
// other until one each is left; the survivors then play a normal round, with
// ties going to the starting player.
describe('end of game', () => {
  it('ends once both players are down to one card, and the beating card wins', () => {
    // player 1 takes player 0's scissors, leaving rock against scissors
    const outcome = moves.removeCard.apply([['rock', 'scissor'], ['scissor']], asPlayer(1), 'scissor');
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the round to the second player when their card beats the first', () => {
    // leaves rock against paper: paper (player 1) wins
    const outcome = moves.removeCard.apply([['rock'], ['paper', 'rock']], asPlayer(0), 'rock');
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it.each(CARDS)('gives two %s cards to the starting player', card => {
    // player 1 takes player 0's spare card, leaving the same card on both sides
    const spare = CARDS.find(other => other !== card)!;
    const outcome = moves.removeCard.apply([[card, spare], [card]], asPlayer(1), spare);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while either player holds more than one card', () => {
    const outcome = moves.removeCard.apply(
      [['rock', 'paper', 'scissor'], ['rock', 'paper']], asPlayer(0), 'paper'
    );
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
