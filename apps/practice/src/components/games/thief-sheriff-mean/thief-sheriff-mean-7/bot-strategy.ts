import { sample } from 'lodash';
import { Sheriff, Thief, getUntakenCards, type Board } from '../helpers';
import type { StrategyArgs } from '../../../game-factory/types';

const CARD_COUNT = 7;

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.takeCard(board, [sample(getUntakenCards(board, CARD_COUNT))]);
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
    const move = getMove(board);
    moves.takeCard(board, [move]);
}

const getMove = (board: Board) => {
  const cards: (number | null)[] = Array(CARD_COUNT).fill(null);
  board.cards[Sheriff].forEach(card => {
    cards[card - 1] = Sheriff;
  });
  board.cards[Thief].forEach(card => {
    cards[card - 1] = Thief;
  });
  const meanCounts = getMeanCounts(cards)
    .map((count, idx) => [count, idx])
    .filter((_, idx) => cards[idx] === null);
  // find max count that is not taken by sheriff or thief
  const maxCount = Math.max(...meanCounts.map(([count]) => count));
  // return the card that participates in the most good sets of three cards
  // take only ones with max value
  const maxIndices = meanCounts.filter(([count]) => count === maxCount)
    .map(([, idx]) => idx);
  return sample(maxIndices)! + 1;
}

const findPossibleMeans = (cards) => {
  // get all good sets of three cards
  const means: number[][] = [];
  for (let i = 0; i < (CARD_COUNT - 2); i++) {
    for (let j = i + 1; j < (CARD_COUNT - 1); j++) {
      for (let k = j + 1; k < CARD_COUNT; k++) {
        if (cards[i] === Sheriff || cards[j] === Sheriff || cards[k] === Sheriff) {
          continue;
        }
        if (i + k === 2 * j) {
          means.push([i, j, k]);
        }
      }
    }
  }
  return means;
}

const getMeanCounts = (cards) => {
  const counts = Array(CARD_COUNT).fill(0);
  findPossibleMeans(cards).forEach(mean => {
    counts[mean[0]]++;
    counts[mean[1]]++;
    counts[mean[2]]++;
  });
  return counts;
}
