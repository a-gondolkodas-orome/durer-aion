import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { getPlayerStepDescription, isLegalPlacement, MyGameWrapper, possibleMoves, startingPosition } from './game';
import type { MyGameState } from './game';

type State = MyGameState & GameStateMixin;

// Category E: the first player plays O, one at a time; the second X, two at a
// time. The team here plays X.
function teamAsX(): { G: State, ctx: Ctx } {
  const G = { ...startingPosition('E'), firstPlayer: JUDGE_PLAYER, winner: null, difficulty: 'test' } as unknown as State;
  const ctx = { phase: 'play', currentPlayer: GUESSER_PLAYER } as Ctx;
  return { G, ctx };
}

function place({ G, ctx }: { G: State, ctx: Ctx }, indices: number[]) {
  const events = { endTurn: vi.fn(), endGame: vi.fn() };
  const placeMarks = MyGameWrapper('E').moves?.placeMarks as (context: unknown, indices: unknown) => unknown;
  placeMarks({ G, ctx, events }, indices);
  return events;
}

describe('the 5×5 game\'s X turn', () => {
  test('takes the two X\'s one at a time, ending the turn with the second', () => {
    const state = teamAsX();

    expect(place(state, [0]).endTurn).not.toHaveBeenCalled();
    expect(state.G.xsThisTurn).toStrictEqual([0]);
    expect(isLegalPlacement(state.G, state.ctx, [1, 2])).toBe(false);

    expect(place(state, [1]).endTurn).toHaveBeenCalled();
    expect(state.G.xsThisTurn).toStrictEqual([]);
  });

  test('takes both X\'s at once, as the bot plays them', () => {
    const state = teamAsX();

    expect(place(state, [0, 1]).endTurn).toHaveBeenCalled();
    expect(state.G.cells.filter(cell => cell === 'X')).toHaveLength(2);
  });

  test('offers the bots only placements that finish the turn', () => {
    const state = teamAsX();
    state.G.cells[0] = 'X';
    state.G.cells[1] = 'X';
    state.G.cells[2] = 'X';
    state.G.cells[3] = 'X';

    const singles = possibleMoves(state.G, state.ctx).filter(({ args: [indices] }) => indices.length === 1);
    expect(singles).toStrictEqual([{ move: 'placeMarks', args: [[4]] }]);
  });
});

describe('the 5×5 game\'s step description', () => {
  test('asks for a circle from the side playing O', () => {
    const { G } = teamAsX();
    expect(getPlayerStepDescription({ G: { ...G, firstPlayer: GUESSER_PLAYER }, ctx: { currentPlayer: GUESSER_PLAYER } }))
      .toBe('Tegyetek egy kört egy üres mezőre!');
  });

  test('asks for the first X, then the second once one is down', () => {
    const state = teamAsX();
    expect(getPlayerStepDescription(state)).toBe('Tegyétek le az első X-et!');
    place(state, [0]);
    expect(getPlayerStepDescription(state)).toBe('Tegyétek le a második X-et!');
  });
});
