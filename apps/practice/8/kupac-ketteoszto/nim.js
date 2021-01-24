'use strict';

const nim = function() {

    let board = [4, 5];

    let playerOne = true;
    let isGameOver = true;
    let isPlayerWinner = false;

    const generateBoard = function() {
        board = [Math.floor(Math.random() * 4) + 3, Math.floor(Math.random() * 4) + 3];

        return board;
    };
    
    generateBoard();

    const move = function(obj) {
        board = obj;
        playerOne = !playerOne;
        if (board[0] == 1 && board[1] == 1) {
            isGameOver = true;
            isPlayerWinner = !playerOne;
        }
        return board;

    };

    const getBoard = function() {
        return JSON.parse(JSON.stringify(board));
    };

    const getStatus = function() {
        if (isGameOver) {
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
        isGameOver = false;
    }

    return {
        move: move,
        board: getBoard,
        status: getStatus,
        startGameAsPlayer: startGameAsPlayer,
        newBoard: generateBoard
    };
}
