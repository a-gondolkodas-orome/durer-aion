'use strict';

import { random, cloneDeep, sample, range, sum } from 'lodash';
import { useState } from 'react';
import { generateNewBoard } from '../../chess-bishops/strategy/strategy';



export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {

  if (playerIndex === 0) {
    return aiDefense(board);
  } else {
    return aiAttack(board);
  }
};

const compareCellsLeft = ({first, second}) => {
    const firstAxis = Math.floor(0.5*first[0]+first[1]);
    const secondAxis = Math.floor(0.5*second[0]+second[1]);
    
    if (first === second) return 0;
    else {
        if (firstAxis > secondAxis || (firstAxis === secondAxis && first[0] < second[0])) {
            return 1;
        } else {
            return -1;
        }
    }
}

let defensePaths = [];
let attackCells = [];
//let [defenseBoard, setDefenseBoard] = useState(generateNewBoard());

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
        // in case we want ai to find winning state from a later position, this ordering is necessary
        /*bacteria.sort((a,b) => {a === b ? 0 : (Math.floor(0.5*a[0]+a[1]) > Math.floor(0.5*b[0]+b[1]) || 
            (Math.floor(0.5*a[0]+a[1]) === Math.floor(0.5*b[0]+b[1]) && a[0] < b[0]) ? 1 : -1)});*/
        let deficient = false;
        let reached = false;
        //let jStart = -1;
        for(let j = 0; j<bacteria.length && !deficient; j++) {
            let reachables = reachable({row: bacteria[j][0], col: bacteria[j][1],board: freeBoard});
            reached = false;
            /*let newPath = [];
            if (reachables.length > 0) {
                let row = reachables[0][0]; let col = reachables[0][1];
                freeBoard[row][col] = -3;
                reached = true;
                for(let pathRowIt = bacteria[j][0]; pathRowIt < row; pathRowIt++) {
                    newPath.push([pathRowIt,col]);
                    freeBoard[pathRowIt][col] = -3;
                    if (freeBoard[pathRowIt+1][col-0.5-0.5*(-1)**(pathRowIt+1)] >= 0) {
                        col = col-0.5-0.5*(-1)**pathRowIt;
                    } else {
                        col = col+0.5+0.5*(-1)**(pathRowIt+1);
                    }
                }
                newPath.push([row,reachables[0][1]]);
                defensePaths.push(newPath);
                setDefenseBoard(freeBoard);
            }*/
            if (!reached) {
                deficient = true;
                //jStart = j;
            }
        };
        if (deficient) {
            /*let iEnd = jStart;
            for (let i = jStart; i>=0 && reached; i--) {
                let reachables = reachable({row: bacteria[i][0], col: bacteria[i][1],board: freeBoard});
                reached = false;
                if (reachables.length > 0) {
                    let rowFree = reachables[reachables.length-1][0]; let colFree = reachables[reachables.length-1][1];
                    freeBoard[rowFree][colFree] = -3;
                    attackCells.push([row,col]);
                    reached = true;
                }
                if (!reached) {iEnd = i;}
            }*/
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
        /*for (let row = 0; row < 9; row++) {
            for (let col = 0; col < getSizeOfBoard(board)-1       ; col++) {

            }
        }*/
    }
    const isGameEnd = getOccupied(newBoard).length === 0;
    return {newBoard, isGameEnd};
}

const aiAttack = (board) => {
    let newBoard = cloneDeep(board);
    let isGameEnd = false;
    if (!aiWins) {aiWins = whoWins(board) === 0;}

    if (!aiWins) {
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

const findPaths = (board) => {
    
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

const reachable = ({row,col,board}) => {
    const boardSize = getSizeOfBoard(board);
    const cells = [];
    let leftReachBorderRow = 8;
    let leftReachBorderCol = Math.ceil(0.5*row-4+col);
    if (leftReachBorderCol < 0) {
        leftReachBorderRow = 2*Math.ceil(col-0.5*row);
        leftReachBorderCol = 0;
        for (let rowIt = leftReachBorderRow; rowIt < 9; rowIt += 2) {
            if (board[rowIt][leftReachBorderCol] >= 0) { cells.push([rowIt,leftReachBorderCol])}
        }
    }
    let rightReachBorderRow = 8;
    let rightReachBorderCol = Math.floor(4-0.5*row+col);

    for (let colIt = leftReachBorderCol; colIt <= Math.min(boardSize-1,rightReachBorderCol); colIt++) {
        if (board[rightReachBorderRow][colIt] >= 0) {cells.push([rightReachBorderRow,colIt])}
    }
    if (rightReachBorderCol >= boardSize) {
        rightReachBorderCol = boardSize-1;
        rightReachBorderRow = 2*Math.floor(boardSize- col+0.5*row);
        for (let rowIt = 6; rowIt >= rightReachBorderRow; rowIt -= 2) {
            if (board[rowIt][rightReachBorderCol] >= 0) { cells.push([rowIt,rightReachBorderCol])}
        }
    }
    return cells;
}