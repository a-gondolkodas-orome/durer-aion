'use strict';

/* 
  Finding optimal step is too slow real-time after only 1 or 2 ducks, that is why
  we pre-generate positions. Later, after more ducks have been placed, we
  calculate optimal moves real-time.
*/

const { flatMap, range, sample, cloneDeep, shuffle, isEqual } = require('lodash');
const fs = require('fs');

const [ROWS, COLS] = [4, 7];
const [DUCK, FORBIDDEN] = [1, 2];

// eloszor legeneralunk minden nem uto part
const uniqueStates = range(ROWS).map((r1) => range(COLS).map((c1) =>
  range(ROWS).map((r2) => range(COLS).map((c2) => {
    if ((r1 * ROWS + c1) < (r2 * ROWS + c2)) {
      // ahol uti egymast a ket kacsa, az nem valid kezdohelyzet
      if (c1 === c2 && Math.abs(r1 - r2) === 1) {
        return false;
      }
      if (r1 === r2 && Math.abs(c1 - c2) === 1) {
        return false;
      }

      return true;
    }
    return false;
  }))  
));

const flipH = ([r, c]) => [ROWS - 1 - r, c];
const flipV = ([r, c]) => [r, COLS - 1 - c];

const markAsSame = (uniqueStates, mb1, mb2) => {
  uniqueStates[mb1[0]][mb1[1]][mb2[0]][mb2[1]] = false;
  uniqueStates[mb2[0]][mb2[1]][mb1[0]][mb1[1]] = false;
}

const isDifferentPair = (b1, b2, mb1, mb2) =>
  !isEqual([b1, b2], [mb1, mb2]) && !isEqual([b1, b2], [mb2, mb1]);

// kiszitáljuk a duplikátumokat, azaz ami egybevágó mert azok stratégia
// szempontbol egyutt kezelhetoek
range(ROWS).map((r1) => range(COLS).map((c1) =>
  range(ROWS).map((r2) => range(COLS).map((c2) => {
    if (uniqueStates[r1][c1][r2][c2]) {
      const b1 = [r1, c1];
      const b2 = [r2, c2];

      // vertical flip
      let mb1 = flipV(b1);
      let mb2 = flipV(b2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }

      // rotate 180
      mb1 = flipH(mb1);
      mb2 = flipH(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }

      // horizontal flip
      mb1 = flipV(mb1);
      mb2 = flipV(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
    }
  }))  
));

// collect those left
const uniqueDuckPairs = [];
range(ROWS).map((r1) => range(COLS).map((c1) =>
  range(ROWS).map((r2) => range(COLS).map((c2) => {
    if (uniqueStates[r1][c1][r2][c2]) {
      console.log(`${r1};${c1} - ${r2};${c2}`)
      uniqueDuckPairs.push([r1, c1, r2, c2]);
    }
  }))  
));

const boardIndices = flatMap(range(0, ROWS), row => range(0, COLS).map(col => ({ row, col })));

const getOptimalAiMove = (board) => {
  const allowedMoves = getAllowedMoves(board);

  const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row][col] = DUCK;
    return isWinningState(boardCopy, false);
  });


  if (optimalPlace !== undefined) {
    return { optimal: true, move: optimalPlace };
  }
  
  return { optimal: false, move: sample(allowedMoves) };
};

const getAllowedMoves = (board) => {
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

const markForbiddenFields = (board, { row, col }) => {
  if (row - 1 >= 0) {
    board[(row - 1)][col] = FORBIDDEN;
  }
  if (row + 1 <= (ROWS - 1)) {
    board[(row + 1)][col] = FORBIDDEN;
  }
  if (col - 1 >= 0) {
    board[(row)][col - 1] = FORBIDDEN;
  }
  if (col + 1 <= (COLS - 1)) {
    board[(row)][col + 1] = FORBIDDEN;
  }
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIPlayer) => {
  if (getAllowedMoves(board).length === 0) {
    return true;
  }

  const allowedPlacesForOther = getAllowedMoves(board);

  const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row][col] = DUCK;
    return isWinningState(boardCopy, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

const optimalMoves = {};

// get optimal move for each possible unique state after 1 duck has been placed
console.log(`Will search optimal step for ${uniqueDuckPairs.length} positions`)
uniqueDuckPairs.map(([r1, c1, r2, c2]) => {
  const nextBoard = range(0, ROWS).map(() => range(0, COLS).map(() => null));
  
  markForbiddenFields(nextBoard, { row: r1, col: c1 });
  nextBoard[r1][c1] = DUCK;
  markForbiddenFields(nextBoard, { row: r2, col: c2 });
  nextBoard[r2][c2] = DUCK;
  
  const initialMessage = `Initial steps: ${JSON.stringify({ r1, c1, r2, c2 })}`;
  
  console.log(initialMessage);
  // fs.appendFileSync(
  //   './scripts/pre-generate-ai-moves/chess-ducks-3rd-steps.txt',
  //   initialMessage + '\n'
  // );
  
  const startDate = new Date();
  
  const optimalMove = getOptimalAiMove(nextBoard);
  
  const endDate = new Date();
  const calcDuration = Math.trunc((endDate - startDate)/1000);
  const aiMoveMessage = `
    ${new Date().toISOString()}:\
    AI Move: (calc took ${calcDuration.toString().padStart(3, '0')} seconds):\
    ${JSON.stringify(optimalMove)}\
  `.replace(/\s+/g, ' ');
  
  console.log(aiMoveMessage);
  // fs.appendFileSync(
  //   './scripts/pre-generate-ai-moves/chess-ducks-3rd-steps.txt',
  //   aiMoveMessage + '\n'
  // )

  if (optimalMove.optimal) {
    optimalMoves[`${r1};${c1} - ${r2};${c2}`] = optimalMove['move'];
  }
})

console.log(optimalMoves);
