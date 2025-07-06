const Sheriff = 0;
const Thief = 1;
const Nobody = 2;

export const aiBotStrategy = ({ board, moves, ctx }) => {
    const move = getMove(board, ctx.chosenRoleIndex);
    console.log(move);
    moves.takeCard(board, [move]);
}

function getMove(board) {
  let cards = Array(7).fill(Nobody);
  board.sheriffCards.forEach(card => {
    cards[card - 1] = Sheriff;
  });
  board.thiefCards.forEach(card => {
    cards[card - 1] = Thief;
  });
  const meanCounts = getMeanCounts(cards);
  const maxCount = Math.max(...meanCounts);
  // return the card that participates in the most good sets of three cards
  let maxIndices = meanCounts.reduce((acc, count, index) => {
    if (count === maxCount && cards[index] === Nobody) {
      acc.push(index);
    }
    return acc;
  }, []);
  return choose(maxIndices) + 1;
}

function choose(choices) {
  let index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function findPossibleMeans(cards) {
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

function getMeanCounts(cards) {
  let counts = Array(7).fill(0);
  findPossibleMeans(cards).forEach(mean => {
    counts[mean[0]]++;
    counts[mean[1]]++;
    counts[mean[2]]++;
  });
  return counts;
}
