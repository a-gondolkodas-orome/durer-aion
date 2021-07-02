import { makeMove } from './strategy';
import { getStatus, getBoard, startGameAsPlayer, generateNewBoard, move } from './communication';
import {
  drawBoard,
  enablePlayerMoves,
  disablePlayerMoves,
  toggleGameStartButtons,
  updateGamePrompts
} from './game-board';

let enemyMoveTimeoutHandle;

export const reactToPlayerMove = function(lastMove) {
  drawBoard(move(lastMove));
  checkGame();
  if (getStatus().isGameInProgress) aiMove();
};

export const startGame = function(isFirstPlayer) {
  startGameAsPlayer(isFirstPlayer);

  toggleGameStartButtons(false);
  updateGamePrompts();

  if (!isFirstPlayer) aiMove();
};

export const resetGame = function() {
  // If new board is requested while enemy move is in progress
  clearTimeout(enemyMoveTimeoutHandle);
  gameContainer().querySelector('.game__loader').style.visibility = 'hidden';

  drawBoard(generateNewBoard());
  updateGamePrompts();
  toggleGameStartButtons(true);

};

const checkGame = function() {
    updateGamePrompts();

    if (!getStatus().isGameInProgress) {
        toggleGameStartButtons(false);
        gameContainer().querySelector('.game__loader').style.visibility = 'hidden';
    }
}

const aiMove = function() {
    disablePlayerMoves();

    const time = Math.floor(Math.random() * 750 + 750);
    enemyMoveTimeoutHandle = setTimeout(() => {
        drawBoard(move(makeMove(getBoard())))
        checkGame();
        enablePlayerMoves();
    }, time);
}

const gameContainer = () => document.querySelector('#kupac-ketteoszto');
