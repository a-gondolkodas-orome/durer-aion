import { makeMove } from './strategy';
import { move, generateNewBoard, getBoard, getStatus, startGameAsPlayer } from './communication';
import {
  drawBoard,
  updateGamePrompts,
  toggleGameStartButtons,
  toggleVisibilityForElements,
  disablePlayerMoves,
  enablePlayerMoves
} from './game-board';

const gameContainer = () => document.querySelector('#hunyadi-es-a-janicsarok');
let enemyMoveTimeoutHandle;

export const reactToPlayerMove = function(lastMove) {
    drawBoard(move(lastMove));
    checkGame();
    if (getStatus().isGameInProgress) aiMove();
};

export const startGame = function(isFirstPlayer) {
    startGameAsPlayer(isFirstPlayer);

    toggleGameStartButtons(false);

    toggleVisibilityForElements('game__step-for-first', isFirstPlayer);
    toggleVisibilityForElements('game__step-for-second', !isFirstPlayer);

    updateGamePrompts();

    if (!isFirstPlayer) aiMove();
};

export const resetGame = function() {
    // If new board is requested while enemy move is in progress
    clearTimeout(enemyMoveTimeoutHandle);
    gameContainer().querySelector('.js-enemy-loader').style.visibility = 'hidden';

    drawBoard(generateNewBoard());
    toggleGameStartButtons(true);
    toggleVisibilityForElements('game__step-for-', false);
    updateGamePrompts();
};

const checkGame = function() {
  updateGamePrompts();

  if (!getStatus().isGameInProgress) {
    toggleVisibilityForElements('game__step-for', false);
    toggleGameStartButtons(false);
    gameContainer().querySelector('.js-enemy-loader').style.visibility = 'hidden';
  }
};

const aiMove = function() {
  disablePlayerMoves();

  const time = Math.floor(Math.random() * 750 + 750);
  enemyMoveTimeoutHandle = setTimeout(() => {
    drawBoard(move(makeMove(getBoard(), getStatus().killState)));
    checkGame();
    enablePlayerMoves();
  }, time);
};
