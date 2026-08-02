import { moves } from './architect-and-bandits-a';
import { ARCHITECT, BANDITS, type Board } from '../helpers';
import { makeCtx } from '../../../../test-utils';

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
