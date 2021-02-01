'use strict';

const nim = function() {

    // array of number of pieces in each pile
    let board;

    let shouldPlayerMoveNext;
    let gameStatus;
    let isPlayerWinner;

    const generateNewBoard = function() {
        gameStatus = 'readyToStart';
        board = [Math.floor(Math.random() * 4) + 3, Math.floor(Math.random() * 4) + 3];
        return board;
    };

    const move = function(newBoardState) {
        board = newBoardState;
        shouldPlayerMoveNext = !shouldPlayerMoveNext;
        if (board[0] == 1 && board[1] == 1) {
            gameStatus = 'finished';
            isPlayerWinner = !shouldPlayerMoveNext;
        }
        return board;
    };

    const getBoard = function() {
        return JSON.parse(JSON.stringify(board));
    };

    const getStatus = function() {
        return {
            isGameInProgress: gameStatus === 'inProgress',
            isGameFinished: gameStatus === 'finished',
            isGameReadyToStart: gameStatus === 'readyToStart',
            shouldPlayerMoveNext: gameStatus === 'inProgress' ? shouldPlayerMoveNext : undefined,
            isPlayerWinner: gameStatus === 'finished' ? isPlayerWinner : undefined
        };
    };

    const startGameAsPlayer = function(isFirstPlayer) {
        shouldPlayerMoveNext = isFirstPlayer;
        gameStatus = 'inProgress';
    };

    return {
        move,
        getBoard,
        getStatus,
        startGameAsPlayer,
        generateNewBoard
    };
};
