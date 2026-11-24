import type { Ctx } from 'boardgame.io';
import { PHASE } from '../../../common/gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { BOARD_SIZE, MyGameWrapper, startingPosition } from './game';
import type { MyGameState } from './game';
import { winningStrategyForX } from './strategy';

type State = MyGameState & GameStateMixin;
type Moves = [[number], string][];

// Category E: the team opens with O, the bot plays X, two at a time.
function botAsX(marks: Record<number, 'O' | 'X'> = {}): { G: State, ctx: Ctx } {
  const G = { ...startingPosition('E'), firstPlayer: GUESSER_PLAYER, winner: null, difficulty: 'live' } as unknown as State;
  for (const [index, mark] of Object.entries(marks)) G.cells[Number(index)] = mark;
  return { G, ctx: { phase: PHASE.play, currentPlayer: JUDGE_PLAYER } as Ctx };
}

function place(state: { G: State, ctx: Ctx }, index: number) {
  const placeMark = MyGameWrapper('E').moves?.placeMark as (context: unknown, index: unknown) => unknown;
  return placeMark({ ...state, events: { endTurn: vi.fn(), endGame: vi.fn() } }, index);
}

const row = (index: number) => Math.floor(index / BOARD_SIZE);
const column = (index: number) => index % BOARD_SIZE;

describe('the 5×5 game\'s X bot', () => {
  test('names its opening turn as two X\'s, off the O\'s row and column and each other\'s', () => {
    const state = botAsX({ 12: 'O' });
    const turn = winningStrategyForX(state as never) as Moves;

    expect(turn.map(([, name]) => name)).toStrictEqual(['placeMark', 'placeMark']);
    const occupied = [12, ...turn.map(([[index]]) => index)];
    expect(new Set(occupied.map(row)).size).toBe(3);
    expect(new Set(occupied.map(column)).size).toBe(3);
  });

  // Its plan for the turn depends on the X count, which is odd between its two
  // X's: a backend restarted there asks it from that board.
  test('asked between its two X\'s, places the second of the same plan', () => {
    const state = botAsX({ 0: 'X', 12: 'O', 18: 'X', 24: 'O' });
    const [[[first]], second] = winningStrategyForX(state as never) as Moves;

    expect(place(state, first)).toBeUndefined();
    expect(winningStrategyForX(state as never)).toStrictEqual([second]);
  });

  test('wins with one X where one does, before a line that needs two', () => {
    const state = botAsX({ 0: 'X', 1: 'X', 2: 'X', 5: 'X', 10: 'X', 15: 'X' });

    expect(winningStrategyForX(state as never)).toStrictEqual([[[20], 'placeMark']]);
  });
});
