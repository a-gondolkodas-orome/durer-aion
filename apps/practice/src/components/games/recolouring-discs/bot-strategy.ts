import { sample } from 'lodash';
import type { BotMove, BotStrategy } from '../../strategy-game-factory';
import {
  type Board,
  type Cell,
  type Move,
  applyMove,
  colorOf,
  countColor,
  legalMoves,
  majorityWinner
} from './helpers';
import { solveForN } from './solver';
import type { Moves } from './recolouring-discs';

type Bot = BotStrategy<Board, Moves>

interface Option {
  move: Move;
  cells: Cell[];
}

const optionsFor = (cells: Cell[], player: number): Option[] =>
  legalMoves(cells, player).map(move => ({ move, cells: applyMove(cells, player, move) }));

const asBotMove = (move: Move): BotMove<Moves> => {
  if (move.type === 'move') return { move: 'moveDisc', args: [move.from, move.to] };
  if (move.type === 'place') return { move: 'placeDisc', args: [move.to] };
  return { move: 'pass' };
};

const infinityToLarge = (r: number): number => (r === Infinity ? Number.MAX_SAFE_INTEGER : r);

// How many replies the opponent would have that immediately clinch their
// majority from `cells` (opponent to move). Used only when we are losing, to
// avoid handing the opponent an easy instant win.
const opponentInstantWins = (cells: Cell[], opponent: number): number =>
  optionsFor(cells, opponent).filter(o => majorityWinner(o.cells) === opponent).length;

// Optimal bot. Verified in bot-strategy.spec.ts: from the winning role it never
// loses; its moves keep the position in its own attractor and strictly reduce
// the rank, so it always reaches its majority (well within the 200-ply cap).
export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const cells = board.cells;
  const n = cells.length;
  const me = ctx.currentPlayer!;
  const opponent = 1 - me;
  const myColor = colorOf(me);
  const solved = solveForN(n);
  const options = optionsFor(cells, me);

  // Grab an outright win whenever one is available.
  const immediate = options.filter(o => majorityWinner(o.cells) === me);
  if (immediate.length) {
    return asBotMove(immediate[0].move);
  }

  if (solved.winnerAt(cells, me) === me) {
    // Winning: keep every child in our winning region and, when we can force a
    // majority, march toward it by minimising our own rank (children are the
    // opponent's turn, so evaluate rank for the opponent-to-move position).
    const staying = options.filter(o => solved.winnerAt(o.cells, opponent) === me);
    const pool = staying.length ? staying : options;
    const scored = pool.map(o => ({ o, rank: solved.rankAt(o.cells, opponent, me) }));
    const best = Math.min(...scored.map(s => s.rank));
    if (best === Infinity) {
      // We win by stalling (no forced majority): grow our own colour as a hint
      // of progress while staying safe.
      const byCount = pool.map(o => ({ o, count: countColor(o.cells, myColor) }));
      const max = Math.max(...byCount.map(s => s.count));
      return asBotMove(sample(byCount.filter(s => s.count === max))!.o.move);
    }
    return asBotMove(sample(scored.filter(s => s.rank === best))!.o.move);
  }

  // Losing: make the opponent work. Prefer the child that maximises the
  // opponent's forced-win distance (stalling positions count as hardest),
  // breaking ties toward giving them the fewest instant winning replies.
  const scored = options.map(o => ({
    o,
    delay: infinityToLarge(solved.rankAt(o.cells, opponent, opponent)),
    trap: opponentInstantWins(o.cells, opponent)
  }));
  const maxDelay = Math.max(...scored.map(s => s.delay));
  const delayed = scored.filter(s => s.delay === maxDelay);
  const minTrap = Math.min(...delayed.map(s => s.trap));
  return asBotMove(sample(delayed.filter(s => s.trap === minTrap))!.o.move);
};

// Test bot: plays at random, but takes an immediate win when one is available.
export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const cells = board.cells;
  const me = ctx.currentPlayer!;
  const options = optionsFor(cells, me);
  const immediate = options.filter(o => majorityWinner(o.cells) === me);
  const pool = immediate.length ? immediate : options;
  return asBotMove(sample(pool)!.move);
};
