import { describe, expect, it } from 'vitest';
import {
  BLUE,
  RED,
  applyMove,
  encode,
  isDiscMoveAllowed,
  isPlacementAllowed,
  legalMoves,
  majorityWinner,
  moveTargets,
  moves,
  placeTargets,
  startCells,
  type Board,
  type Cell
} from './gameplay';
import { makeCtx } from '../../../test-utils';

const cells = (s: string): Cell[] =>
  [...s].map(c => (c === 'R' ? 'red' : c === 'B' ? 'blue' : null));

describe('recolouring-discs helpers', () => {
  it('sets up the start position with red left and blue right', () => {
    expect(encode(startCells(6))).toBe('R....B');
  });

  it('recolours the opposite disc adjacent to a moved disc', () => {
    // Red moves from 0 to 1; the blue on 2 becomes red.
    expect(encode(applyMove(cells('R.B...'), RED, { type: 'move', from: 0, to: 1 }))).toBe('.RR...');
  });

  it('recolours both neighbours when placing between two opposite discs', () => {
    // Blue places on the empty 2, flipping reds on 1 and 3.
    expect(encode(applyMove(cells('.R.RB.'), BLUE, { type: 'place', to: 2 }))).toBe('.BBBB.');
  });

  it('lets a disc jump over another into an empty cell two away', () => {
    expect(moveTargets(cells('RB..B.'), 0)).toContain(2); // 1 is occupied, jump to empty 2
    expect(moveTargets(cells('RB..B.'), 0)).not.toContain(1); // 1 is occupied
  });

  it('only allows placing on empty cells adjacent to an own disc', () => {
    expect(placeTargets(cells('R...B.'), 'red')).toEqual([1]);
    expect(placeTargets(cells('R...B.'), 'blue')).toEqual([3, 5]);
  });

  it('always offers a pass move', () => {
    expect(legalMoves(startCells(7), RED).some(m => m.type === 'pass')).toBe(true);
  });

  it('only lets a player move a disc of their own colour', () => {
    const board = cells('R...B.');
    expect(isDiscMoveAllowed(board, RED, 0, 1)).toBe(true);
    expect(isDiscMoveAllowed(board, BLUE, 0, 1)).toBe(false); // red's disc
    expect(isDiscMoveAllowed(board, RED, 2, 3)).toBe(false); // no disc at all
  });

  it('rejects moves further than two fields, off the board or onto an occupied cell', () => {
    const board = cells('RB..B.');
    expect(isDiscMoveAllowed(board, RED, 0, 2)).toBe(true); // jump over the blue on 1
    expect(isDiscMoveAllowed(board, RED, 0, 1)).toBe(false); // occupied
    expect(isDiscMoveAllowed(board, RED, 0, 3)).toBe(false); // three fields away
    expect(isDiscMoveAllowed(board, RED, 0, -1)).toBe(false);
    expect(isDiscMoveAllowed(board, RED, -1, 0)).toBe(false);
  });

  it('only lets a player place next to one of their own discs', () => {
    const board = cells('R...B.');
    expect(isPlacementAllowed(board, RED, 1)).toBe(true);
    expect(isPlacementAllowed(board, RED, 3)).toBe(false); // next to blue only
    expect(isPlacementAllowed(board, BLUE, 3)).toBe(true);
    expect(isPlacementAllowed(board, BLUE, 4)).toBe(false); // occupied by blue itself
  });

  it('agrees with the move generator on every legal move', () => {
    const board = cells('R.B.R.B.');
    for (const player of [RED, BLUE]) {
      for (const move of legalMoves(board, player)) {
        if (move.type === 'move') expect(isDiscMoveAllowed(board, player, move.from, move.to)).toBe(true);
        if (move.type === 'place') expect(isPlacementAllowed(board, player, move.to)).toBe(true);
      }
    }
  });

  it('applies the asymmetric majority thresholds', () => {
    // n = 8: red needs > 4 (>= 5), blue needs >= 4.
    expect(majorityWinner(cells('RRRR.BBB'))).toBe(null); // 4 red, 3 blue
    expect(majorityWinner(cells('RRRRR.BB'))).toBe(RED); // 5 red
    expect(majorityWinner(cells('R.RRBBBB'))).toBe(BLUE); // 4 blue
  });
});

// Red wins on strictly more than half the cells, blue on half or more; if
// neither gets there within 200 plies the game is awarded to blue.
const at = (currentPlayer: number, moveCount = 0) =>
  ({ ctx: makeCtx({ currentPlayer, moveCount }) });

const board = (cells: Board['cells']): Board => ({ cells });

describe('end of game', () => {
  it('ends for red once red holds more than half the cells', () => {
    // 3 of 4 red — red needs 3 (2*3 > 4)
    const outcome = moves.pass.apply(board(['red', 'red', 'red', 'blue']), at(RED));
    expect(outcome.gameEnd).toEqual({ winnerIndex: RED });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends for blue once blue holds half the cells', () => {
    // 2 of 4 blue is already enough (2*2 >= 4)
    const outcome = moves.pass.apply(board(['red', null, 'blue', 'blue']), at(BLUE));
    expect(outcome.gameEnd).toEqual({ winnerIndex: BLUE });
  });

  it('passes the turn while neither side has its majority', () => {
    const outcome = moves.pass.apply(board(['red', null, null, 'blue', null, null]), at(RED));
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('awards a stalled game to blue on the 200th ply', () => {
    const cells = board(['red', null, null, 'blue', null, null]);
    expect(moves.pass.apply(cells, at(RED, 198)).gameEnd).toBeUndefined();
    expect(moves.pass.apply(cells, at(RED, 199)).gameEnd).toEqual({ winnerIndex: BLUE });
  });
});
