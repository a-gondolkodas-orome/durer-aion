'use strict';

const nim = function() {

    // array of number of pieces in each pile
    let board;

    let shouldPlayerMoveNext;
    let gameStatus;
    let isPlayerWinner;

    const generateNewBoard = function() {
        gameStatus = 'readyToStart';
        board = [generateRandomIntBetween(3, 6), generateRandomIntBetween(3, 6)];
        return board;
    };

    const generateRandomIntBetween = function(low, high) {
        return Math.floor(Math.random() * (high - low + 1)) + low;
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
