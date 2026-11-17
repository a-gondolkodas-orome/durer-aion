import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { getPlayerStepDescription, isLegalTake, MyGameWrapper, OPENING_PILES, possibleMoves, startingPosition } from './game';
import type { MyGameState } from './game';
import { strategyWrapper, wins } from './strategy';

type State = MyGameState & GameStateMixin;

// The team starts, so it takes 1–3 and the bot 1–4.
function teamFirst(piles = [...OPENING_PILES], difficulty: 'test' | 'live' = 'test'): { G: State, ctx: Ctx } {
  const G = { ...startingPosition(), piles, firstPlayer: GUESSER_PLAYER, winner: null, difficulty,
    winningStreak: 0, numberOfLoss: 0, points: 0 } as unknown as State;
  const ctx = { phase: 'play', currentPlayer: GUESSER_PLAYER } as Ctx;
  return { G, ctx };
}

function move(name: 'selectPile' | 'take', { G, ctx }: { G: State, ctx: Ctx }, ...args: unknown[]) {
  const events = { endTurn: vi.fn(), endGame: vi.fn() };
  const fn = MyGameWrapper().moves?.[name] as (context: unknown, ...args: unknown[]) => unknown;
  return { result: fn({ G, ctx, events }, ...args), events };
}

describe('the two-pile game\'s turn', () => {
  test('chooses a pile first, keeping the turn, then takes from it', () => {
    const state = teamFirst();

    expect(move('selectPile', state, 1).events.endTurn).not.toHaveBeenCalled();
    expect(state.G.selectedPile).toBe(1);
    expect(getPlayerStepDescription(state)).toBe('Vegyetek el 1–3 korongot a(z) 2. kupacból!');

    expect(move('take', state, 1, 2).events.endTurn).toHaveBeenCalled();
    expect(state.G.piles).toStrictEqual([3, 4]);
    expect(state.G.selectedPile).toBeNull();
    expect(getPlayerStepDescription(state)).toBe('Válasszatok egy kupacot!');
  });

  test('refuses a take from another pile than the one chosen', () => {
    const state = teamFirst();
    move('selectPile', state, 0);
    expect(isLegalTake(state.G, state.ctx, 1, 1)).toBe(false);
    expect(move('take', state, 1, 1).result).toBe('INVALID_MOVE');
  });

  test('holds each side to its own limit', () => {
    const { G, ctx } = teamFirst();
    expect(isLegalTake(G, ctx, 1, 3)).toBe(true);
    expect(isLegalTake(G, ctx, 1, 4)).toBe(false);
    expect(isLegalTake(G, { ...ctx, currentPlayer: JUDGE_PLAYER }, 1, 4)).toBe(true);
    expect(isLegalTake(G, ctx, 0, 0)).toBe(false);
  });

  test('refuses an empty pile, and a take larger than the pile', () => {
    const { G, ctx } = teamFirst([0, 2]);
    expect(isLegalTake(G, ctx, 0, 1)).toBe(false);
    expect(isLegalTake(G, ctx, 1, 3)).toBe(false);
    expect(possibleMoves(G, ctx)).toStrictEqual([{ move: 'take', args: [1, 1] }, { move: 'take', args: [1, 2] }]);
  });

  test('gives the game to whoever takes the last token, and the match to a second live win in a row', () => {
    const state = teamFirst([0, 1], 'live');
    state.G.winningStreak = 1;
    const { events } = move('take', state, 1, 1);
    expect(state.G.winner).toBe(GUESSER_PLAYER);
    expect(state.G.points).toBe(12);
    expect(events.endGame).toHaveBeenCalled();
  });
});

describe('the two-pile game\'s bot', () => {
  test('knows the opening is the first player\'s', () => {
    expect(wins(OPENING_PILES, 3, 4)).toBe(true);
  });

  test('leaves a lost position whenever it can, in a live game', () => {
    const state = { ...teamFirst(), ctx: { phase: 'play', currentPlayer: JUDGE_PLAYER } as Ctx };
    state.G.difficulty = 'live';
    for (const piles of [[3, 6], [2, 5], [4, 4], [1, 7]]) {
      state.G.piles = piles;
      const [[pile, count], name] = strategyWrapper()(state as never, JUDGE_PLAYER) as [[number, number], string];
      expect(name).toBe('take');
      expect(isLegalTake(state.G, state.ctx, pile, count)).toBe(true);
      const next = piles.map((size, i) => i === pile ? size - count : size);
      const winnable = possibleMoves(state.G, state.ctx).some(({ args: [p, c] }) => {
        const after = piles.map((size, i) => i === p ? size - c : size);
        return after.every(size => size === 0) || !wins(after, 3, 4);
      });
      if (winnable) expect(next.every(size => size === 0) || !wins(next, 3, 4)).toBe(true);
    }
  });

  test('opens every game from the same piles', () => {
    const state = { G: startingPosition(), ctx: { phase: 'startNewGame' } } as never;
    expect(strategyWrapper()(state, JUDGE_PLAYER)).toStrictEqual([[startingPosition()], 'setStartingPosition']);
  });
});
