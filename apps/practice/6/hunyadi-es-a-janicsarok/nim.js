'use strict';

const nim = function() {

    // array of arrays for each row, pieces are array elements, true means one color, false the other
    let board;

    let shouldPlayerMoveNext;
    let gameStatus;
    let killState;
    let isPlayerWinner;

    const isMoveLegal = function(newBoardState) {
        for (const i in board) {
            if (newBoardState[i].length != board[i].length) {
                return false;
            }
        }
        return true;
    }

    const generateNewBoard = function() {
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
        };
        for (let i = 0; i < 4; i++) {
            for (let j = board[i].length - 1; j >= 0; j--) {
                if (Math.random() > 0.5) {
                    board[i].splice(j, 1);
                    board[i + 1].push(true); board[i + 1].push(true);
                }
            };
        };

        return board;
    };


    const move = function(newBoardState) {
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
                if (board[0][j] != newBoardState) { // a soldier reached the castle
                    gameStatus = 'finished';
                    isPlayerWinner = !shouldPlayerMoveNext;
                }
            }

            for (const i in board) {
                if (i != 0) {
                    for (const j in board[i]) {
                        if (board[i][j] != newBoardState) {
                            sum++;
                            board[i - 1].push(board[i][j]); // a soldier still lives and can step up the stairs
                        }
                    }
                }

                board[i] = [];
            }

            shouldPlayerMoveNext = !shouldPlayerMoveNext;
            console.log(sum, gameStatus);
            if (sum === 0 && gameStatus !== 'finished') {
                gameStatus = 'finished';
                isPlayerWinner = !shouldPlayerMoveNext;
            }

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
            isPlayerWinner: gameStatus === 'finished' ? isPlayerWinner : undefined,
            killState
        };
    }

    const startGameAsPlayer = function(isFirstPlayer) {
        shouldPlayerMoveNext = isFirstPlayer;
        gameStatus = 'inProgress';
    }

    return {
        move,
        getBoard,
        getStatus,
        startGameAsPlayer,
        generateNewBoard
    };
}
