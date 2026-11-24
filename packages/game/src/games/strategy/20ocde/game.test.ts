import type { Ctx } from 'boardgame.io';
import { PHASE } from '../../../common/gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { getPlayerStepDescription, isLegalPlacement, MyGameWrapper, possibleMoves, startingPosition } from './game';
import type { MyGameState } from './game';

type State = MyGameState & GameStateMixin;

// Category E: the first player plays O, one at a time; the second X, two at a
// time. The team here plays X.
function teamAsX(): { G: State, ctx: Ctx } {
  const G = { ...startingPosition('E'), firstPlayer: JUDGE_PLAYER, winner: null, difficulty: 'test' } as unknown as State;
  const ctx = { phase: PHASE.play, currentPlayer: GUESSER_PLAYER } as Ctx;
  return { G, ctx };
}

function place({ G, ctx }: { G: State, ctx: Ctx }, index: number) {
  const events = { endTurn: vi.fn(), endGame: vi.fn() };
  const placeMark = MyGameWrapper('E').moves?.placeMark as (context: unknown, index: unknown) => unknown;
  placeMark({ G, ctx, events }, index);
  return events;
}

describe('the 5×5 game\'s X turn', () => {
  test('takes the two X\'s one at a time, ending the turn with the second', () => {
    const state = teamAsX();

    expect(place(state, 0).endTurn).not.toHaveBeenCalled();
    expect(state.G.xsThisTurn).toStrictEqual([0]);

    expect(place(state, 1).endTurn).toHaveBeenCalled();
    expect(state.G.xsThisTurn).toStrictEqual([]);
  });

  test('ends with a first X that completes a line', () => {
    const state = teamAsX();
    for (const index of [0, 1, 2, 3]) state.G.cells[index] = 'X';

    expect(place(state, 4).endTurn).toHaveBeenCalled();
    expect(state.G.xsThisTurn).toStrictEqual([]);
  });

  test('keeps the bot\'s X\'s of its turn for the board, the first as soon as it lands', () => {
    const state = teamAsX();
    state.G.firstPlayer = GUESSER_PLAYER;
    state.ctx = { ...state.ctx, currentPlayer: JUDGE_PLAYER };

    place(state, 0);
    expect(state.G.lastMachineMove).toStrictEqual([0]);
    place(state, 6);
    expect(state.G.lastMachineMove).toStrictEqual([0, 6]);
  });

  test('offers every empty cell, one at a time', () => {
    const state = teamAsX();
    state.G.cells = state.G.cells.map((_, index) => index < 23 ? 'O' : null);

    expect(possibleMoves(state.G, state.ctx)).toStrictEqual([{ move: 'placeMark', args: [23] }, { move: 'placeMark', args: [24] }]);
    expect(isLegalPlacement(state.G, state.ctx, 0)).toBe(false);
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
    place(state, 0);
    expect(getPlayerStepDescription(state)).toBe('Tegyétek le a második X-et!');
  });
});
