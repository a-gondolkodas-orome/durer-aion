import { sample } from 'lodash';

const Sheriff = 0;
const Thief = 1;
const Nobody = 2;

export const aiBotStrategy = ({ board, moves, ctx }) => {
    const move = getMove(board, ctx.chosenRoleIndex);
    moves.takeCard(board, [move]);
}

const getMove = (board) => {
  let cards = Array(7).fill(Nobody);
  board.sheriffCards.forEach(card => {
    cards[card - 1] = Sheriff;
  });
  board.thiefCards.forEach(card => {
    cards[card - 1] = Thief;
  });
  const meanCounts = getMeanCounts(cards)
    .map((count, idx) => [count, idx])
    .filter((count, idx) => cards[idx] === Nobody);
  // find max count that is not taken by sheriff or thief
  const maxCount = Math.max(...meanCounts.map(([count, idx]) => count));
  // return the card that participates in the most good sets of three cards
  // take only ones with max value
  let maxIndices = meanCounts.filter(([count, idx]) => count === maxCount)
    .map(([count, idx]) => idx);
  return sample(maxIndices) + 1;
}

const findPossibleMeans = (cards) => {
  // get all good sets of three cards
  let means = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 6; j++) {
      for (let k = j + 1; k < 7; k++) {
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
  let counts = Array(7).fill(0);
  findPossibleMeans(cards).forEach(mean => {
    counts[mean[0]]++;
    counts[mean[1]]++;
    counts[mean[2]]++;
  });
  return counts;
}
