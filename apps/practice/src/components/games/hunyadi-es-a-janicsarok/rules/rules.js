'use strict';

let board;

let shouldPlayerMoveNext;
let gameStatus;
let killState;
let isPlayerWinner;

export const generateNewBoard = () => {
  gameStatus = 'readyToStart';
  killState = false;
  let sum = 2.0 + Math.ceil(Math.random() * 8) / 8 - 0.5;
  board = [];
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (sum; sum >= ((1.0 / 2.0) ** i); sum -= ((1.0 / 2.0) ** i)) {
      row.push(true);
    }
    board.push(row);
  }
  for (let i = 0; i < 4; i++) {
    for (let j = board[i].length - 1; j >= 0; j--) {
      if (Math.random() > 0.5) {
        board[i].splice(j, 1);
        board[i + 1].push(true); board[i + 1].push(true);
      }
    }
  }

  return board;
};


export const move = newBoardState => {
  if (!killState) {
    killState = true;

    if (!isMoveLegal(newBoardState)) {
      throw new Error('Nem megengedett lépés!!!');
    }

    board = newBoardState;
    shouldPlayerMoveNext = !shouldPlayerMoveNext;
    return board;
  } else {
    killState = false;
    if (!(newBoardState === true || newBoardState === false)) {
      throw new Error('Nem megengedett szín!!!');
    }

    let sum = 0;
    for (const j in board[0]) {
      if (board[0][j] !== newBoardState) { // a soldier reached the castle
        gameStatus = 'finished';
        isPlayerWinner = !shouldPlayerMoveNext;
      }
    }

    for (const i in board) {
      if (i != 0) {
        for (const j in board[i]) {
          if (board[i][j] !== newBoardState) {
            sum++;
            board[i - 1].push(board[i][j]); // a soldier still lives and can step up the stairs
          }
        }
      }

      board[i] = [];
    }

    shouldPlayerMoveNext = !shouldPlayerMoveNext;
    if (sum === 0 && gameStatus !== 'finished') {
      gameStatus = 'finished';
      isPlayerWinner = !shouldPlayerMoveNext;
    }

  }
  return board;
};

export const getBoard = () => {
  return JSON.parse(JSON.stringify(board));
};

export const getStatus = () => {
  return {
    isGameInProgress: gameStatus === 'inProgress',
    isGameFinished: gameStatus === 'finished',
    isGameReadyToStart: gameStatus === 'readyToStart',
    shouldPlayerMoveNext: gameStatus === 'inProgress' ? shouldPlayerMoveNext : undefined,
    isPlayerWinner: gameStatus === 'finished' ? isPlayerWinner : undefined,
    killState
  };
}

export const startGameAsPlayer = isFirstPlayer => {
  shouldPlayerMoveNext = isFirstPlayer;
  gameStatus = 'inProgress';
}

const isMoveLegal = newBoardState => {
  for (const i in board) {
    if (newBoardState[i].length !== board[i].length) {
      return false;
    }
  }
  return true;
};
