import { range, sample } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { isSubmarineMoveAllowed, type Board, type Moves } from './gameplay';
import { makeGeometry } from './bot-geometry';

type Bot = BotStrategy<Board, Moves>

// Both bots of both lakes. What is genuinely per-variant is passed in: the size
// of the lake, the day the shark has to reach, the researchers' scripted line,
// and — on 5×5 — the precomputed answer that spares the live search on the early
// days it is too slow for.
export const makeSharkBots = ({
  size, maxTurn, preferenceRings, scriptedSubmarineMove, survivingSectors
}: {
  size: number
  maxTurn: number
  // sectors the shark prefers when nothing it can reach is safe, best group first
  preferenceRings: number[][]
  scriptedSubmarineMove: (board: Board) => { from: number; to: number } | undefined
  survivingSectors?: (board: Board, reachable: number[]) => number[] | undefined
}) => {
  const cellCount = size * size;
  const {
    getAdjacentCells, findSubmarineNextToShark, distanceFromShark,
    isReachableWithoutDeath, getIntermediateSharkPosition, getComponentSizes
  } = makeGeometry(size);

  // The shark's turn is a route of up to two steps, named as a whole: the halfway
  // cell is only chosen to reach the target safely, so the two are one decision.
  // Standing still is the one single-step turn — any real first step leaves the
  // turn open for a second, so a route that stops after `via` would strand the
  // bot mid-turn. Returning to `from` is a two-step route like any other.
  const asSharkRoute = (from: number, via: number, to: number): BotMove<Moves>[] =>
    via === from
      ? [{ move: 'moveShark', args: [from] }]
      : [{ move: 'moveShark', args: [via] }, { move: 'moveShark', args: [to] }];

  const randomBotStrategy: Bot = ({ board, ctx }) => {
    if (ctx.chosenRoleIndex === 0) {
      const safeMoves = [...getAdjacentCells(board.shark).filter(c => board.submarines[c] === 0), board.shark];
      const firstPos = sample(safeMoves)!;
      // Staying put is the whole turn; a real first step earns a second one.
      if (firstPos === board.shark) return { move: 'moveShark', args: [firstPos] };
      const safeCells = getAdjacentCells(firstPos).filter(c => board.submarines[c] === 0);
      return asSharkRoute(board.shark, firstPos, sample([...safeCells, firstPos])!);
    } else {
      const winningFrom = findSubmarineNextToShark(board);
      if (winningFrom !== undefined) {
        return { move: 'moveSubmarine', args: [{ from: winningFrom, to: board.shark }] };
      }
      const validMoves: { from: number; to: number }[] = [];
      board.submarines.forEach((count, from) => {
        if (count >= 1) getAdjacentCells(from).forEach(to => validMoves.push({ from, to }));
      });
      const approachingMoves = validMoves.filter(
        ({ from, to }) => distanceFromShark(board.shark, to) < distanceFromShark(board.shark, from)
      );
      return {
        move: 'moveSubmarine',
        args: [sample(approachingMoves.length > 0 ? approachingMoves : validMoves)!]
      };
    }
  };

  const smartBotStrategy: Bot = ({ board, ctx }) => {
    if (ctx.chosenRoleIndex === 0) {
      const finalPos = getNextSharkPositionByAI(board);
      const firstPos = getIntermediateSharkPosition(board.submarines, board.shark, finalPos);
      return asSharkRoute(board.shark, firstPos, finalPos);
    }
    const move = getSubmarineMove(board);
    // Nothing left that wins: the position is already lost, and a bot that plays
    // on beats one that throws inside the engine's timeout, where nothing catches
    // it and the board never moves again.
    return move
      ? { move: 'moveSubmarine', args: [move] }
      : randomBotStrategy({ board, ctx });
  };

  // The scripted line is a table, not a search: it has no entry for the last
  // day, and a shark stepping between its branches leaves it naming a submarine
  // that is not on that sector. Both are positions the shark only reaches by
  // playing badly, so rather than write more table for them, ask the search for
  // a move that still wins. It is cheap: the table covers every day up to its
  // first branch, so the search only ever runs with few days left.
  const getSubmarineMove = (board: Board): { from: number; to: number } | undefined => {
    // A submarine already beside the shark ends the game now, whatever the
    // script would have played next.
    const capture = findSubmarineNextToShark(board);
    if (capture !== undefined) return { from: capture, to: board.shark };

    const scripted = scriptedSubmarineMove(board);
    if (scripted && isSubmarineMoveAllowed(board, scripted.from, scripted.to)) return scripted;
    return findWinningSubmarineMove(board);
  };

  // The move the researchers want wherever the script does not apply: the one
  // after which the shark has no reply that survives the remaining days. This is
  // `canSharkSurviveSubmarineTurn`'s own loop, asked for the move it stops at
  // rather than for whether one exists. Its caller has already taken any capture
  // on offer, so every move considered here leaves a live position to search.
  const findWinningSubmarineMove = (board: Board): { from: number; to: number } | undefined => {
    const { submarines, shark, turn } = board;
    for (const from of range(cellCount)) {
      if (submarines[from] === 0) continue;
      for (const to of getAdjacentCells(from)) {
        const nextSubmarines = submarines.slice();
        nextSubmarines[from] -= 1;
        nextSubmarines[to] += 1;
        if (!canSharkSurviveSharkTurn(nextSubmarines, shark, turn)) return { from, to };
      }
    }
    return undefined;
  };

  // Greedy fallback used only when no move guarantees survival (game is already
  // lost): picks the reachable sector with the largest "safe" connected component
  // (sectors not adjacent to any submarine), preferring the middle of the lake.
  const selectByLocationPreference = (submarines: number[], pool: number[]): number => {
    const componentSizes = getComponentSizes(submarines);

    let maxi = 1;
    for (const i of pool) {
      if (maxi < componentSizes[i]) maxi = componentSizes[i];
    }

    const matching = (ring: number[]) =>
      pool.filter(i => ring.includes(i) && componentSizes[i] === maxi);

    let possibleMoves: number[] = [];
    for (const ring of preferenceRings) {
      possibleMoves = matching(ring);
      if (possibleMoves.length > 0) break;
    }

    return sample(possibleMoves.length > 0 ? possibleMoves : pool)!;
  };

  // Shared across calls: the three predicates below are pure functions of
  // (submarines, shark, turn), so results from earlier moves and tests remain
  // valid and are worth keeping.
  const memo = new Map<string, boolean>();

  const stateKey = (submarines: number[], shark: number, turn: number, phase: 'sub' | 'shark'): string =>
    `${submarines.join(',')}|${shark}|${turn}|${phase}`;

  // Is the shark guaranteed to survive to the last day if it moves to `to` on its
  // current turn, assuming the researchers then play optimally from here on?
  const isMoveWinning = (submarines: number[], to: number, turn: number): boolean => {
    const nextTurn = turn + 1;
    if (nextTurn > maxTurn) return true;
    return canSharkSurviveSubmarineTurn(submarines, to, nextTurn);
  };

  // Researchers move next (one submarine, one adjacent step); can they force a
  // capture from here, however the shark plays afterwards?
  const canSharkSurviveSubmarineTurn = (
    submarines: number[], shark: number, turn: number
  ): boolean => {
    const key = stateKey(submarines, shark, turn, 'sub');
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    let sharkSurvives = true;
    outer: for (const from of range(cellCount)) {
      if (submarines[from] === 0) continue;
      for (const to of getAdjacentCells(from)) {
        const nextSubmarines = submarines.slice();
        nextSubmarines[from] -= 1;
        nextSubmarines[to] += 1;
        const sharkSurvivesHere =
          nextSubmarines[shark] < 1 && canSharkSurviveSharkTurn(nextSubmarines, shark, turn);
        if (!sharkSurvivesHere) {
          sharkSurvives = false;
          break outer;
        }
      }
    }
    memo.set(key, sharkSurvives);
    return sharkSurvives;
  };

  // Shark moves next; does it have at least one move (of up to 2 steps) keeping
  // it safe?
  const canSharkSurviveSharkTurn = (
    submarines: number[], shark: number, turn: number
  ): boolean => {
    const key = stateKey(submarines, shark, turn, 'shark');
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    let sharkSurvives = false;
    for (const to of range(cellCount)) {
      if (isReachableWithoutDeath(submarines, shark, to) && isMoveWinning(submarines, to, turn)) {
        sharkSurvives = true;
        break;
      }
    }
    memo.set(key, sharkSurvives);
    return sharkSurvives;
  };

  // Always a sector: the shark's own one is reachable whenever the game is still
  // running, so the pool the preference falls back on is never empty.
  const getNextSharkPositionByAI = (board: Board): number => {
    const { submarines, shark, turn } = board;
    const reachable = range(cellCount).filter(i => isReachableWithoutDeath(submarines, shark, i));

    const surviving = survivingSectors?.(board, reachable)
      ?? reachable.filter(to => isMoveWinning(submarines, to, turn));

    return selectByLocationPreference(submarines, surviving.length > 0 ? surviving : reachable);
  };

  return { randomBotStrategy, smartBotStrategy, getNextSharkPositionByAI };
};
