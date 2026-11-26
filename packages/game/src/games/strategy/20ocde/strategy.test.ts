import type { Ctx } from 'boardgame.io';
import { PHASE } from '../../../common/gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { BOARD_SIZE, MyGameWrapper, startingPosition } from './game';
import type { MyGameState } from './game';
import { winningStrategyForX } from './strategy';

type State = MyGameState & GameStateMixin;
type Move = [[number], string];

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

/// The bot's next X, placed, as a test's host plays it: asked once per move.
function botPlaces(state: { G: State, ctx: Ctx }): number {
  const [[index], name] = winningStrategyForX(state as never) as Move;
  expect(name).toBe('placeMark');
  expect(place(state, index)).toBeUndefined();
  return index;
}

describe('the 5×5 game\'s X bot', () => {
  test('opens with two X\'s off the O\'s row and column and each other\'s, asked for one at a time', () => {
    // The opening is drawn at random, so the second X must fit whichever first was drawn.
    for (let i = 0; i < 50; i++) {
      const state = botAsX({ 12: 'O' });
      const occupied = [12, botPlaces(state), botPlaces(state)];
      expect(new Set(occupied.map(row)).size).toBe(3);
      expect(new Set(occupied.map(column)).size).toBe(3);
    }
  });

  // Its plan for the turn depends on the X count, which is odd between its two
  // X's: the second is planned from the board with the first taken back.
  test('places the second X of the plan its first was part of', () => {
    const state = botAsX({ 0: 'X', 12: 'O', 18: 'X', 24: 'O' });
    botPlaces(state);
    const seconds = new Set(Array.from({ length: 20 }, () => (winningStrategyForX(state as never) as Move)[0][0]));
    expect(seconds.size).toBe(1);
  });

  test('wins with one X where one does, before a line that needs two', () => {
    const state = botAsX({ 0: 'X', 1: 'X', 2: 'X', 5: 'X', 10: 'X', 15: 'X' });

    expect(winningStrategyForX(state as never)).toStrictEqual([[20], 'placeMark']);
  });
});
