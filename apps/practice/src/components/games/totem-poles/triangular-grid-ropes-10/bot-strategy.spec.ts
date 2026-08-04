import { isEqual } from 'lodash';
import { runMatch, type MatchResult } from '../../../strategy-game-factory';
import {
  getAllowedMoves, isAllowed, edgeDirection, mirrorNodes, moves, type Board, type Edge
} from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { botNextMoveArgs, makeCtx } from '../../../../test-utils';

// Play a real game through the engine: the same moves, validator and win
// detection the site runs on.
const play = (
  strategies: [typeof smartBotStrategy, typeof smartBotStrategy]
): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard: [] as Board });

// A bot reads its own seat off ctx.chosenRoleIndex, which holds the seat the
// human took — so the mover is the bot whose human sits second.
const askMover = (board: Board): Edge =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0, chosenRoleIndex: 1 }) }))[0];

const mirrorOf = (direction: keyof typeof mirrorNodes, { from, to }: Edge): Edge =>
  ({ from: mirrorNodes[direction][from]!, to: mirrorNodes[direction][to]! });

const isSameEdge = (a: Edge, b: Edge) => isEqual(a, b) || isEqual(a, { from: b.to, to: b.from });

const SYMMETRY_OPENINGS: Edge[] = [{ from: 3, to: 5 }, { from: 1, to: 8 }, { from: 2, to: 7 }];

// The mover wins this grid, by opening on a symmetry axis and answering into
// it; the replier is lost and can only win on a mistake. The searching half of
// the strategy runs unmemoised, which is why TriangularGridRopes[1] is listed
// out of plays-to-an-end.spec.ts, so these play a few games rather than sweep.
describe('smartBotStrategy', () => {
  it('wins as the mover against the random bot', () => {
    for (let trial = 0; trial < 3; trial++) {
      expect(play([smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
    }
  }, 20000);

  // This also runs the searching half of the strategy, which is what the bot
  // uses from the replier's seat. Nothing is asserted about the replier
  // winning: that seat is lost, and once the search finds no winning move the
  // bot falls back to a random legal one — so against a random opponent it
  // wins only when that opponent errs, which is not every game.
  it('wins as the mover in optimal-vs-optimal play', () => {
    expect(play([smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
  }, 20000);
});

// As the mover the bot never searches: it opens on an axis and keeps the
// position balanced, which is cheap enough to state exhaustively.
describe('the mirroring half of the strategy', () => {
  it('opens on one of the three symmetry axes', () => {
    for (let trial = 0; trial < 20; trial++) {
      const opened = askMover([]);
      expect(SYMMETRY_OPENINGS.some(opening => isSameEdge(opened, opening))).toBe(true);
    }
  });

  it('answers an axis reply on the axis, and every other reply with its mirror', () => {
    for (const opening of SYMMETRY_OPENINGS) {
      const direction = edgeDirection(opening)!;

      for (const reply of getAllowedMoves([opening])) {
        const answer = askMover([opening, reply]);
        expect(isAllowed([opening, reply], answer)).toBe(true);

        if (edgeDirection(reply) === direction) {
          // an axis edge has no free mirror to answer with — another axis edge
          // is what keeps the count even
          expect(edgeDirection(answer)).toBe(direction);
        } else {
          expect(isSameEdge(answer, mirrorOf(direction, reply))).toBe(true);
        }
      }
    }
  });
});

describe('randomBotStrategy', () => {
  it('only ever names an edge the game allows', () => {
    let board: Board = [];
    while (getAllowedMoves(board).length > 0) {
      const edge = botNextMoveArgs(randomBotStrategy({ board, ctx: makeCtx({ currentPlayer: 0 }) }))[0];
      expect(isAllowed(board, edge)).toBe(true);
      board = [...board, edge];
    }
  });
});
