import { sample, shuffle } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import {
  type Board,
  applyRemoval,
  countMinPiles,
  isTerminal,
  minPileSize,
  nonEmptyIndices,
  removerWins
} from './helpers';

type Removal = { index: number; amount: number };

const allPairs = (indices: number[]): [number, number][] => {
  const pairs: [number, number][] = [];
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      pairs.push([indices[a], indices[b]]);
    }
  }
  return pairs;
};

const allRemovals = (piles: number[], from: number[]): Removal[] =>
  from.flatMap(index => range1(piles[index]).map(amount => ({ index, amount })));

const range1 = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

// How many of the opponent's replies (they remove from one of the two pointed
// piles) leave us — the next remover — in a losing position. Used only when we
// are losing anyway, to point at the pair that gives the opponent the fewest
// winning answers, maximising the chance a fallible opponent slips up.
const opponentWinningReplies = (piles: number[], pair: [number, number]): number => {
  let count = 0;
  for (const removal of allRemovals(piles, pair)) {
    const next = applyRemoval(piles, removal.index, removal.amount);
    if (next.every(p => p === 0)) {
      count++; // opponent takes the last stone and wins outright
    } else if (!removerWins(next)) {
      count++; // opponent hands us a losing position
    }
  }
  return count;
};

// Best (lowest) opponent-winning-reply count we can force by our next pointing.
const trapScore = (piles: number[]): number => {
  const nonEmpty = nonEmptyIndices(piles);
  if (nonEmpty.length === 1) return opponentWinningReplies(piles, [nonEmpty[0], nonEmpty[0]]);
  return Math.min(...allPairs(nonEmpty).map(pair => opponentWinningReplies(piles, pair)));
};

// Choose which piles to point at for the other player (who will take next).
export const choosePointing = (board: Board): number[] => {
  const { piles } = board;
  const nonEmpty = nonEmptyIndices(piles);
  if (nonEmpty.length === 1) return [nonEmpty[0]];

  const k = minPileSize(piles);
  const minimalPiles = nonEmpty.filter(i => piles[i] === k);

  if (countMinPiles(piles) % 2 === 0) {
    // Opponent is losing: point at two smallest piles to force them to break parity.
    return shuffle(minimalPiles).slice(0, 2);
  }

  // We are losing: point at the pair that leaves the opponent the fewest winning replies.
  const pairs = allPairs(nonEmpty);
  const best = Math.min(...pairs.map(pair => opponentWinningReplies(piles, pair)));
  return sample(pairs.filter(pair => opponentWinningReplies(piles, pair) === best))!;
};

// Choose how many stones to take from one of the pointed piles.
export const chooseRemoval = (board: Board): Removal => {
  const { piles, pointed } = board;
  const pointedPiles = pointed!;
  const k = minPileSize(piles);

  if (removerWins(piles)) {
    const larger = pointedPiles.find(i => piles[i] > k);
    if (larger !== undefined) {
      // Shave a larger pile down to the minimum size (adds one minimal pile).
      return { index: larger, amount: piles[larger] - k };
    }
    // Both pointed piles are minimal: empty one of them.
    return { index: pointedPiles[0], amount: k };
  }

  // Losing position: no move wins against optimal play, so pick the removal that
  // afterwards lets us set the hardest trap (fewest winning replies for them).
  const options = allRemovals(piles, pointedPiles);
  const winning = options.find(({ index, amount }) =>
    applyRemoval(piles, index, amount).every(p => p === 0)
  );
  if (winning) return winning; // safety net: grab an outright win if one exists
  const scored = options.map(o => ({ o, score: trapScore(applyRemoval(piles, o.index, o.amount)) }));
  const best = Math.min(...scored.map(s => s.score));
  return sample(scored.filter(s => s.score === best))!.o;
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (board.pointed !== null) {
    const { index, amount } = chooseRemoval(board);
    const { nextBoard } = moves.takeStones(board, index, amount);
    if (!isTerminal(nextBoard)) {
      setTimeout(() => moves.pointPiles(nextBoard, choosePointing(nextBoard)), 700);
    }
  } else {
    moves.pointPiles(board, choosePointing(board));
  }
};

// Test bot: takes/points at random, but grabs the last stone when it can.
const randomRemoval = (board: Board): Removal => {
  const { piles, pointed } = board;
  const options = allRemovals(piles, pointed!);
  const winning = options.find(({ index, amount }) =>
    applyRemoval(piles, index, amount).every(p => p === 0)
  );
  return winning ?? sample(options)!;
};

const randomPointing = (board: Board): number[] => {
  const nonEmpty = nonEmptyIndices(board.piles);
  if (nonEmpty.length === 1) return [nonEmpty[0]];
  return shuffle(nonEmpty).slice(0, 2);
};

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (board.pointed !== null) {
    const { index, amount } = randomRemoval(board);
    const { nextBoard } = moves.takeStones(board, index, amount);
    if (!isTerminal(nextBoard)) {
      setTimeout(() => moves.pointPiles(nextBoard, randomPointing(nextBoard)), 700);
    }
  } else {
    moves.pointPiles(board, randomPointing(board));
  }
};
