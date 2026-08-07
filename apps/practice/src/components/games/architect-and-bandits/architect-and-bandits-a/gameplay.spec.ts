import { generateStartBoard, moves } from './gameplay';
import { ARCHITECT, BANDITS, KM_PER_EDGE, type Board } from '../gameplay';
import { makeCtx } from 'test-utils';

// After the fourth day the architect wins exactly when every vertex carries a
// tower.
const meta = { ctx: makeCtx({ currentPlayer: BANDITS }) };

const VERTEX_COUNT = 8;

const boardWith = (towers: boolean[], day: number): Board =>
  ({ architectPosition: 0, towers, day, kmUsedToday: 20 });

const allStanding = () => Array(VERTEX_COUNT).fill(true);

describe('architect-and-bandits-a end of game', () => {
  it('gives the game to the architect when day 4 ends with every tower standing', () => {
    const outcome = moves.endDay.apply(boardWith(allStanding(), 4));
    expect(outcome.gameEnd).toEqual({ winnerIndex: ARCHITECT });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the bandits when any tower is missing on day 4', () => {
    const towers = allStanding();
    towers[VERTEX_COUNT - 1] = false;
    const outcome = moves.endDay.apply(boardWith(towers, 4));
    expect(outcome.gameEnd).toEqual({ winnerIndex: BANDITS });
  });

  it.each([1, 2, 3])('only passes the turn at the end of day %i', day => {
    const outcome = moves.endDay.apply(boardWith(allStanding(), day));
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.nextBoard.kmUsedToday).toBe(0);
  });

  it('schedules the end-of-turn move after the bandits knock a tower down', () => {
    const outcome = moves.destroyTower.apply(boardWith(allStanding(), 2), meta, 3);
    expect(outcome.nextBoard.towers[3]).toBe(false);
    expect(outcome.autoEndOfTurn).toBe(true);
    // the scheduled `startNextDay` is what ends the turn, not this move
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});

// The rule builds a tower wherever the architect's journey touches a bare
// vertex, "including at the very start or end of the day". That happens in three
// places, none of which the end-of-game tests above reach.
describe('architect-and-bandits-a tower building', () => {
  const noTowers = () => Array(VERTEX_COUNT).fill(false);

  it('raises a tower on every vertex the architect steps onto', () => {
    const board = { architectPosition: 0, towers: noTowers(), day: 1, kmUsedToday: 0 };
    const outcome = moves.moveArchitect.apply(board, meta, 1);
    expect(outcome.nextBoard.towers[1]).toBe(true);
    expect(outcome.nextBoard.architectPosition).toBe(1);
    // walking uses up the day's allowance one edge at a time
    expect(outcome.nextBoard.kmUsedToday).toBe(KM_PER_EDGE);
    // the architect may keep walking, so the turn stays open
    expect(outcome.isTurnEnd).toBeUndefined();
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('leaves a tower the bandits knocked down standing again at dawn', () => {
    // the architect spent the night on vertex 3 and the bandits razed it
    const towers = Array(VERTEX_COUNT).fill(true);
    towers[3] = false;
    const outcome = moves.startNextDay.apply({
      architectPosition: 3, towers, day: 2, kmUsedToday: 40
    });
    expect(outcome.nextBoard.towers[3]).toBe(true);
    expect(outcome.nextBoard.day).toBe(3);
    expect(outcome.nextBoard.kmUsedToday).toBe(0);
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('starts day 1 with a tower already on the architect\'s vertex', () => {
    const board = generateStartBoard();
    expect(board.towers).toHaveLength(VERTEX_COUNT);
    expect(board.architectPosition).toBe(0);
    expect(board.towers[0]).toBe(true);
    expect(board.towers.filter(Boolean)).toHaveLength(1);
    expect(board.day).toBe(1);
  });
});
