import { asBotMoves, unknownMoveMessage, isBotTurnUnfinished } from './bot-turn';
import { createInitialCoreState, type CoreState } from './store';

const stateWith = (patch: Partial<CoreState<number[]>> = {}): CoreState<number[]> =>
  ({ ...createInitialCoreState<number[]>([1, 2, 3]), ...patch });

// A strategy may name one move or a whole turn; both callers — the React shell
// and the headless runner — play the result out as a list either way.
describe('asBotMoves', () => {
  it('wraps a single named move', () => {
    expect(asBotMoves({ move: 'removeCoin', args: [2] }))
      .toEqual([{ move: 'removeCoin', args: [2] }]);
  });

  it('passes a named turn through in order', () => {
    const turn = [{ move: 'discardPile', args: [0] }, { move: 'splitPile', args: [1, 2] }];
    expect(asBotMoves(turn)).toEqual(turn);
  });

  it('keeps a move that named no args', () => {
    expect(asBotMoves({ move: 'pass' })).toEqual([{ move: 'pass' }]);
  });

  // An empty plan is not repaired here: run-match.ts turns it into an error,
  // which is the point — a strategy that names nothing is a bug, not a pass.
  it('leaves an empty plan empty for the caller to reject', () => {
    expect(asBotMoves([])).toEqual([]);
  });
});

// A move name is only checked when it is played, so the message is the whole
// diagnosis: it has to say which name failed and what was on offer.
describe('unknownMoveMessage', () => {
  it('names the bad move and lists the ones the game has', () => {
    const message = unknownMoveMessage('removeCoins', { removeCoin: {}, splitPile: {} });

    expect(message).toContain("'removeCoins'");
    expect(message).toContain('removeCoin, splitPile');
  });

  it('still reads sensibly for a game with no moves at all', () => {
    expect(unknownMoveMessage('anything', {})).toContain('this game has: ');
  });
});

// Drives "ask the strategy again": a bot that named only the first move of a
// multi-phase turn is asked for the rest while the turn is still its own.
describe('isBotTurnUnfinished', () => {
  it('is true while the bot is still to move in the play phase', () => {
    expect(isBotTurnUnfinished(stateWith({ phase: 'play', currentPlayer: 1 }), 1)).toBe(true);
  });

  it('is false once the turn has passed to the other player', () => {
    expect(isBotTurnUnfinished(stateWith({ phase: 'play', currentPlayer: 0 }), 1)).toBe(false);
  });

  it('is false once the game has ended, even on the bot’s own turn', () => {
    expect(isBotTurnUnfinished(stateWith({ phase: 'gameEnd', currentPlayer: 1 }), 1)).toBe(false);
  });

  it('is false before the game starts', () => {
    expect(isBotTurnUnfinished(stateWith({ phase: 'roleSelection', currentPlayer: null }), 1))
      .toBe(false);
  });
});
