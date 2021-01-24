'use strict';

const nim = function() {

    //The Game board
    let board =
        [[true],
        [true],
        [true, true, true],
        [true, true, true],
        [true, true, true]];



    let playerOne = true;
    let isBeginningOfGame = true;
    let isGameOverb = false;
    let killState = false;
    let isPlayerWinner = false;

    const isMoveLegal = function(obj) {
        for (const i in board) {
            if (obj[i].length != board[i].length) {
                return false;
            }
        }
        return true;
    }

    const generateBoard = function() {
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

    generateBoard();



    const move = function(obj) {
        if (!killState) {
            isBeginningOfGame = false;
            killState = true;
            //parseObj(obj);


            if (!isMoveLegal(obj)) {
                throw new Error('Nem megengedett lépés!!!');
            }

            board = obj;
            playerOne = !playerOne;
            //!Move the soldiers
            return board;
        } else {
            killState = false;
            isBeginningOfGame = false;
            if (!(obj === true || obj === false)) {
                throw new Error('Nem megengedett szín!!!');
            }


            let sum = 0;
            for (const j in board[0]) {
                if (board[0][j] != obj) {
                    isGameOverb = true;
                    isPlayerWinner = !playerOne;
                }
            }

            for (const i in board) {
                if (i != 0) {
                    for (const j in board[i]) {
                        if (board[i][j] != obj) {
                            sum++;
                            board[i - 1].push(board[i][j]);
                        }
                    }
                }

                board[i] = [];
            }

            playerOne = !playerOne;
            if (sum == 0 && !isGameOverb) {
                isGameOverb = true;
                isPlayerWinner = !playerOne;
            }

        }
        return board;
    };

    const getBoard = function() {
        return JSON.parse(JSON.stringify(board));
    };

    const getPlayer = function() {
        return playerOne;
    };
    const getState = function() {
        return killState;
    };

    const isGameOver = function() {
        return isGameOverb;
    };

    const getStatus = function() {
        if (isGameOver()) {
            return {
                player: !isPlayerWinner ? "Sajnos, most nem nyertél, de ne add fel." : "Nyertél. Gratulálunk! :)",
                isGameOn: false
            };
        }

        return {
            player: playerOne ? "Te jössz." : "Mi jövünk.",
            isGameOn: true
        }

    }

    const startGameAsPlayer = function(isFirstPlayer) {
        playerOne = isFirstPlayer;
        isBeginningOfGame = true;
        isGameOverb = false;
        killState = false;
    }

    return {
        move: move,
        board: getBoard,
        play: getPlayer,
        status: getStatus,
        state: getState,
        startGameAsPlayer: startGameAsPlayer,
        newBoard: generateBoard
    };
}
