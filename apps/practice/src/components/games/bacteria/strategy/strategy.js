'use strict';

import { cloneDeep, sample, range } from 'lodash';


export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {

  if (playerIndex === 0) {
    return aiDefense(board);
  } else {
    return aiAttack(board);
  }
};

const whoWins = (board) => {
    if (getSizeOfBoard(board) + 2*4 - getGoals(board).length < getBacteria(board).length) {
        return 0;
    } else {
        let freeBoard = cloneDeep(board);
        const goals = getGoals(board);
        goals.forEach(goal => {
            freeBoard[8][Math.max(0,goal-1)] = -4;
            freeBoard[8][Math.min(getSizeOfBoard(board),goal+1)] = -4;
        })
        goals.forEach(goal => {freeBoard[8][goal] = -1;});
        for(let row = 7; row >= 0; row--) {
            for(let col = 0; col < getSizeOfBoard(board)-1; col++) {
                if (freeBoard[row+1][col]* freeBoard[row+1][col + (-1)**(row+1)] < 0) {
                    if (freeBoard[row+1][col] + freeBoard[row+1][col + (-1)**(row+1)] % 2 === 0) {
                        freeBoard[row][col] = -2;
                    } else if (freeBoard[row+1][col] + freeBoard[row+1][col + (-1)**(row+1)] === -3) {
                        freeBoard[row][col] = -3;
                    }
                }
            }
        }

        const bacteria = getBacteria(board);
        let deficient = false;
        let reached = false;
        for(let j = 0; j<bacteria.length && !deficient; j++) {
            reached = false;
            if (!reached) {
                deficient = true;
            }
        };
        if (deficient) {
            return 0;
        } else {
            return 1;
        }
    }
}

let aiWins = false;

const aiDefense = (board) => {
    let newBoard = cloneDeep(board);
    if (!aiWins) {aiWins = whoWins(board) === 1;}

    if (!aiWins) {
        const [randomRow, randomCol] = sample(getBacteria(board));
        newBoard[randomRow][randomCol] -= 1;
    } else {
        // TODO: follow strategy
        const [randomRow, randomCol] = sample(getBacteria(board));
        newBoard[randomRow][randomCol] -= 1;
    }
    const isGameEnd = getOccupied(newBoard).length === 0;
    return { newBoard, isGameEnd };
}

const aiAttack = (board) => {
    let newBoard = cloneDeep(board);
    let isGameEnd = false;
    if (!aiWins) {aiWins = whoWins(board) === 0;}

    // TODO: if aiWins, follow strategy instead of random step
    if (!aiWins || aiWins) {
        const [randomRow, randomCol] = sample(getBacteria(board));
        let attackOptions = range(3);
        if (randomRow > 6) {attackOptions.pop()}
        if (randomRow > 7) {attackOptions.pop()}
        const attackChoice = sample(attackOptions);
        switch (attackChoice) {
            case 0: {
                // shift attack
                let pm = 2*Math.round(Math.random())-1;
                if (randomCol === 0) {pm = 1;}
                else if (randomCol === getSizeOfBoard(board)-1-0.5-0.5*(-1)**(randomRow+1)) {pm = -1;}
                newBoard[randomRow][randomCol] = 0;
                newBoard[randomRow][randomCol + pm] += board[randomRow][randomCol];
                isGameEnd = board[randomRow][randomCol + pm] === -1;
                break;
            }
            case 1: {
                // spread attack
                if (randomRow%2 === 1 || (randomCol > 0 && randomCol < getSizeOfBoard(board)-1)) {
                    newBoard[randomRow][randomCol] = 0;
                    newBoard[randomRow+1][randomCol] += board[randomRow][randomCol];
                    newBoard[randomRow+1][randomCol + (-1)**(randomRow+1)] += board[randomRow][randomCol];
                    isGameEnd = (board[randomRow+1][randomCol + (-1)**(randomRow+1)] === -1 ||
                                board[randomRow+1][randomCol] === -1);
                } else if (randomCol === 0) {
                    newBoard[randomRow+1][randomCol] += board[randomRow][randomCol];
                    isGameEnd = board[randomRow+1][randomCol] === -1;
                } else {
                    newBoard[randomRow+1][randomCol - 1] += board[randomRow][randomCol];
                    isGameEnd = board[randomRow+1][randomCol-1] === -1;
                }
                break;
            }
            case 2: {
                // jump attack
                newBoard[randomRow][randomCol] -= 1;
                newBoard[randomRow+2][randomCol] += 1;
                isGameEnd = board[randomRow+2][randomCol] === -1;
            }
        }
    }
    return {newBoard, isGameEnd};
}

const getBacteria = (board) => {
    let bacteria = []
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            for (let i = 0; i < board[row][col]; i++) { bacteria.push([row,col]); }
        }
    }
    return bacteria;
}

const getOccupied = (board) => {
    let occupied = [];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] > 0) { occupied.push([row,col]); }
        }
    }
    return occupied;
}

const getGoals = (board) => {
    let goals = [];
    for (let col = 0; col < board[8].length; col++) {
        if (board[8][col] < 0) { goals.push(col); }
    }
    return goals;
}

const getSizeOfBoard = (board) => {
    return board[0].length;
}
