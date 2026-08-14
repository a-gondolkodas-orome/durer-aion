import { cloneDeep } from 'lodash';
import { runMatch } from 'strategy-game-factory';
import { forcedWinnerIndex } from 'test-utils';
import { getNextSharkPositionByAI, randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { RESEARCHERS, type Board } from '../gameplay';
import { moves, startBoard } from './gameplay';

const makeBoard = (submarines: number[], shark: number, turn: number): Board => ({
  submarines, shark, turn, sharkMovesInTurn: 0
});

describe('getNextSharkPositionByAI', () => {
  it('avoid losing in next step if possible', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 4;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('avoid losing in next step by staying in place', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v1', () => {
    const submarines = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 1,
      0, 0, 1, 0
    ];
    const shark = 15;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(15);
  });

  it('stays in place if instant losing otherwise: v2', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 0, 0, 1,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 3;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(3);
  });

  it('stays in place if instant losing otherwise: v3', () => {
    const submarines = [
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0,
      0, 1, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v4', () => {
    const submarines = [
      0, 1, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 0,
      0, 1, 0, 0
    ];
    const shark = 12;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(12);
  });

  it('picks the move that guarantees survival rather than the old heuristic\'s losing pick (regression)', () => {
    // From here, the old component-size + center>edge>corner heuristic deterministically
    // picked cell 2 (its only candidate), which loses by force in a few turns. Cell 14 is
    // the actual winning move (verified by exhaustive game-tree search).
    const submarines = [
      0, 0, 0, 0,
      0, 0, 0, 2,
      0, 1, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 10;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 6));
    expect(position).toEqual(14);
  });
});

// The researchers' half is not a search but a table of moves per day, branching
// on where the shark is, and nothing played it before this: the sweep in
// plays-to-an-end.spec.ts asks only that a match ends, so a script that wins
// and one that merely finishes read the same there. `runMatch` throws on a move
// the game's own `validate` rejects, so these pin that the table names a legal
// move on every line as well as that it wins.
describe('the researchers\' scripted line', () => {
  const catchesTheShark = () => runMatch({
    gameplay: { moves },
    strategies: [smartBotStrategy, randomBotStrategy],
    startBoard: cloneDeep(startBoard)
  }).winnerIndex;

  it('catches a shark that flees at random, whichever line it takes', () => {
    // A match is ~30 moves of table lookups, so a run of them stays in the
    // milliseconds (AGENTS.md § Testing) while covering many escape lines.
    const winners = new Set(Array.from({ length: 60 }, catchesTheShark));
    expect([...winners]).toEqual([RESEARCHERS]);
  });

  it('catches the optimal shark from the start board', () => {
    expect(forcedWinnerIndex({
      gameplay: { moves }, botStrategy: smartBotStrategy, startBoard
    })).toBe(RESEARCHERS);
  });
});
