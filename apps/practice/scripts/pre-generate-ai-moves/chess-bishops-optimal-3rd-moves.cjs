'use strict';

/* 
  If the player is second, but does not play optimally, we try to search for an
  optimal move after two bishops. This is too slow to do real-time, that is why
  we pre-generate positions. Later, after more bishops have been placed, we
  calculate optimal moves real-time.

  This is script is quite slow, ~2 hours to run in full. That is why we also
  write results to file so that we can start again from the middle if needed.
*/

const { flatMap, range, sample, cloneDeep, shuffle, isEqual } = require('lodash');
const fs = require('fs');

const boardSize = 8;

// eloszor legeneralunk minden nem tengelyesen tukros párt
const uniqueStates = range(boardSize).map((r1) => range(boardSize).map((c1) =>
  range(boardSize).map((r2) => range(boardSize).map((c2) => {
    if ((r1 * boardSize + c1) < (r2 * boardSize + c2)) {
      // ami tukros, ott biztosan nincs nyero lepes
      if (r1 == r2 && c1 == (boardSize - 1 - c2)) {
        return false;
      }
      if (c1 == c2 && r1 == (boardSize - 1 - r2)) {
        return false;
      }
      // ahol uti egymast a ket futo, az nem valid kezdohelyzet
      if ((r2 - r1) == (c2 - c1)) {
        return false;
      }
      if ((r2 - r1) == (c1 - c2)) {
        return false;
      }

      return true;
    }
    return false;
  }))  
));

const rotate90 = ([r, c]) => [c, boardSize - 1 - r];
const flip = ([r, c]) => [boardSize - 1 - r, c];

const markAsSame = (uniqueStates, mb1, mb2) => {
  uniqueStates[mb1[0]][mb1[1]][mb2[0]][mb2[1]] = false;
  uniqueStates[mb2[0]][mb2[1]][mb1[0]][mb1[1]] = false;
}

const isDifferentPair = (b1, b2, mb1, mb2) =>
  !isEqual([b1, b2], [mb1, mb2]) && !isEqual([b1, b2], [mb2, mb1]);

// kiszitáljuk a duplikátumokat, azaz ami egybevágó mert azok stratégia
// szempontbol egyutt kezelhetoek
range(boardSize).map((r1) => range(boardSize).map((c1) =>
  range(boardSize).map((r2) => range(boardSize).map((c2) => {
    if (uniqueStates[r1][c1][r2][c2]) {
      const b1 = [r1, c1];
      const b2 = [r2, c2];

      // rotate 90
      let mb1 = rotate90(b1);
      let mb2 = rotate90(b2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // rotate 180
      mb1 = rotate90(mb1);
      mb2 = rotate90(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // rotate 270
      mb1 = rotate90(mb1);
      mb2 = rotate90(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // horizontal flip
      mb1 = flip(mb1);
      mb2 = flip(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // horizontal flip + rotate 90
      mb1 = rotate90(mb1);
      mb2 = rotate90(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // horizontal flip + rotate 180
      mb1 = rotate90(mb1);
      mb2 = rotate90(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
      // horizontal flip + rotate 270
      mb1 = rotate90(mb1);
      mb2 = rotate90(mb2);
      if (isDifferentPair(b1, b2, mb1, mb2)) {
        markAsSame(uniqueStates, mb1, mb2);
      }
    }
  }))  
));

// collect those left
const uniqueBishopPairs = [];
range(boardSize).map((r1) => range(boardSize).map((c1) =>
  range(boardSize).map((r2) => range(boardSize).map((c2) => {
    if (uniqueStates[r1][c1][r2][c2]) {
      console.log(`${r1};${c1} - ${r2};${c2}`)
      uniqueBishopPairs.push([r1, c1, r2, c2]);
    }
  }))  
));

const boardIndices = flatMap(range(0, boardSize), row => range(0, boardSize).map(col => ({ row, col })));

const BISHOP = 1;
const FORBIDDEN = 2;

const getOptimalAiMove = (board) => {
  const allowedMoves = getAllowedMoves(board);

  const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row][col] = BISHOP;
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
  range(0, boardSize).forEach(i => {
    if (row - i >= 0 && col - i >= 0) {
      board[(row - i)][col - i] = FORBIDDEN;
    }
    if (row + i <= (boardSize - 1) && col + i <= (boardSize - 1)) {
      board[(row + i)][col + i] = FORBIDDEN;
    }
    if (row + i <= (boardSize - 1) && col - i >= 0) {
      board[(row + i)][col - i] = FORBIDDEN;
    }
    if (row - i >= 0 && col + i <= (boardSize - 1)) {
      board[(row - i)][col + i] = FORBIDDEN;
    }
  });
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
    boardCopy[row][col] = BISHOP;
    return isWinningState(boardCopy, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

const optimalMoves = {};

// get optimal move for each possible unique state after 2 bishops have been placed
// for simplicity, invalid pairs are also included
console.log(`Will search optimal step for ${uniqueBishopPairs.length} positions`)
uniqueBishopPairs.map(([r1, c1, r2, c2]) => {
  const newBoard = range(0, boardSize).map(() => range(0, boardSize).map(() => null));
  
  markForbiddenFields(newBoard, { row: r1, col: c1 });
  newBoard[r1][c1] = BISHOP;
  markForbiddenFields(newBoard, { row: r2, col: c2 });
  newBoard[r2][c2] = BISHOP;
  
  const initialMessage = `Initial steps: ${JSON.stringify({ r1, c1, r2, c2 })}`;
  
  console.log(initialMessage);
  // fs.appendFileSync(
  //   './scripts/pre-generate-ai-moves/chess-bishops-third-steps.txt',
  //   initialMessage + '\n'
  // );
  
  const startDate = new Date();
  
  const optimalMove = getOptimalAiMove(newBoard);
  
  const endDate = new Date();
  const calcDuration = Math.trunc((endDate - startDate)/1000);
  const aiMoveMessage = `
    ${new Date().toISOString()}:\
    AI Move: (calc took ${calcDuration.toString().padStart(3, '0')} seconds):\
    ${JSON.stringify(optimalMove)}\
  `.replace(/\s+/g, ' ');
  
  console.log(aiMoveMessage);
  // fs.appendFileSync(
  //   './scripts/pre-generate-ai-moves/chess-bishops-third-steps.txt',
  //   aiMoveMessage + '\n'
  // )

  optimalMoves[`${r1};${c1} - ${r2};${c2}`] = optimalMove['move'];
})

console.log(optimalMoves);
