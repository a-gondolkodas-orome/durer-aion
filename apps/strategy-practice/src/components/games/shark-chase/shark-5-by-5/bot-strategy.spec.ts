import { cloneDeep } from 'lodash';
import { runMatch } from 'strategy-game-factory';
import { botNextMove, forcedWinnerIndex, makeCtx, moveValidator } from 'test-utils';
import { getNextSharkPositionByAI, randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { RESEARCHERS, type Board } from '../gameplay';
import { moves, startBoard } from './gameplay';

const makeBoard = (submarines: number[], shark: number, turn: number): Board => ({
  submarines, shark, turn, sharkMovesInTurn: 0
});

describe('getNextSharkPositionByAI', () => {
  it('picks the move that guarantees survival rather than the old heuristic\'s losing pick (regression)', () => {
    // From here, the old component-size + location-preference heuristic deterministically
    // picked cell 3 (its only candidate), which loses by force. Cell 7 is the actual
    // winning move (verified by exhaustive game-tree search).
    const submarines = [
      0, 1, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 1, 2,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ];
    const shark = 2;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 12));
    expect(position).toEqual(7);
  });

  it('uses the precomputed exception table for early turns instead of the live search', () => {
    // Turn 8 is within PRECOMPUTE_MAX_TURN, so this must resolve via table lookup, not
    // the (multi-second, on early turns) exact search. The plain heuristic alone would
    // pick cell 2 here; the table overrides it with the actual winning move, 5.
    const submarines = [
      0, 0, 0, 0, 1,
      0, 0, 0, 0, 0,
      0, 1, 0, 1, 1,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 8));
    expect(position).toEqual(5);
  });
});

// The same property the 4 × 4 spec pins, and now the run against a randomly
// fleeing shark too — the one this script used not to survive. Both positions
// it got wrong are here: the day its table names a submarine that is not there,
// and a day it has no entry for at all.
//
// Nothing else plays this line: `plays-to-an-end.spec.ts` skips SharkChase5[1]
// for the cost of its shark, leaving the scripted researchers to this file.
describe('the researchers\' scripted line', () => {
  const catchesTheShark = () => runMatch({
    gameplay: { moves },
    strategies: [smartBotStrategy, randomBotStrategy],
    startBoard: cloneDeep(startBoard)
  }).winnerIndex;

  it('catches a shark that flees at random, whichever line it takes', () => {
    // Long enough to reach the late days: a random shark is usually caught well
    // before them, so a run of 60 matches — which is what the 4 × 4 spec needs —
    // reached day 12 in only about half of its executions, and the bug this file
    // covers lives there. 400 is still under a second, since the random shark
    // does no searching and the researchers' half is table lookups.
    const winners = new Set(Array.from({ length: 400 }, catchesTheShark));
    expect([...winners]).toEqual([RESEARCHERS]);
  });

  it('catches the optimal shark from the start board', () => {
    expect(forcedWinnerIndex({
      gameplay: { moves }, botStrategy: smartBotStrategy, startBoard
    })).toBe(RESEARCHERS);
  });

  it('wins on from the day the table names a submarine that is not there', () => {
    // The table's own opening reaches this after 9 → 14 → 19 on the second
    // branch, and its day-12 entry there is `from 0`, a sector that has never
    // held a submarine. Every shark that lives to day 12 down that branch used
    // to land here, and the move was rejected as illegal.
    const board = makeBoard([
      0, 0, 0, 1, 0,
      0, 0, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 0, 1,
      0, 1, 0, 0, 0
    ], 23, 12);
    const winners = new Set(Array.from({ length: 20 }, () => runMatch({
      gameplay: { moves },
      strategies: [smartBotStrategy, randomBotStrategy],
      startBoard: cloneDeep(board)
    }).winnerIndex));
    expect([...winners]).toEqual([RESEARCHERS]);
  });

  it('still names a legal move where the table has no entry', () => {
    // The table stops at day 14, and the last day is 15. The two tests above say
    // the shark cannot reach that day, so this is the position the script is not
    // written for — reached by hand, since the point is what happens if it ever
    // is: the bot used to name `undefined` here and throw inside the engine's
    // timeout, leaving the board frozen for good.
    const submarines = Array(25).fill(0);
    submarines[0] = 1;
    const board = makeBoard(submarines, 24, 15);
    const { move, args } = botNextMove(smartBotStrategy({
      board, ctx: makeCtx({ currentPlayer: RESEARCHERS, chosenRoleIndex: 1 })
    }));
    expect(move).toBe('moveSubmarine');
    expect(moveValidator(moves.moveSubmarine, makeCtx({ currentPlayer: RESEARCHERS }))(
      board, ...args as [{ from: number; to: number }]
    )).toBe(true);
  });
});
