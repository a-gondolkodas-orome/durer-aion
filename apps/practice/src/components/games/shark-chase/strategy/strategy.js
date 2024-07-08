'use strict';

import { cloneDeep } from 'lodash';

const roleColors = ['red', 'blue'];

export const playerColor = playerIndex => playerIndex === 0 ? roleColors[0] : roleColors[1];
const aiColor = playerIndex => playerIndex === 0 ? roleColors[1] : roleColors[0];

const moveSubmarine = (from,to, board) => {
  const newBoard = cloneDeep(board);
  newBoard.board[from] = null;
  newBoard.board[to] = aiColor(playerIndex);
  return getGameStateAfterMove(newBoard);
}

export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const findSubmarineNextToShark = () => {
    if (board.shark+4 < 16 && board.board[board.shark+4] === 'red') return board.shark+4;
    if (board.shark-4 >= 0 && board.board[board.shark-4] === 'red') return board.shark-4;
    if (board.shark+1 < 16 && board.shark%4 !== 3 && board.board[board.shark+1] === 'red') return board.shark+1;
    if (board.shark-1 >= 0 && board.shark%4 !== 0 && board.board[board.shark-1] === 'red') return board.shark-1;
    return -1;
  }

  const moveSubmarine = (from,to) => {
    const newBoard = cloneDeep(board);
    if(board.shark === to) newBoard.shark = -1;
    newBoard.board[to] = aiColor(playerIndex);
    newBoard.board[from] = null;
    return getGameStateAfterMove(newBoard);
  }
  if (playerIndex === 0)
  {
    const newMove = getOptimalAiPlacingPositionShark(board, playerIndex);
    //console.log(newMove);
    const newBoard = cloneDeep(board);
    newBoard.board[board.shark] = null;
    newBoard.board[newMove] = aiColor(playerIndex);
    newBoard.shark = newMove
    return getGameStateAfterMove(newBoard);
  }
  else
  {
    let place = findSubmarineNextToShark();
    if(place!==-1)
    {
      return moveSubmarine(place, board.shark);

    }
    switch(board.turn){
      case 1:
        return moveSubmarine(2,1);
        break;
      case 2:
        return moveSubmarine(1,5);
        break;
      case 3:
        return moveSubmarine(7,6);
        break;
      case 4:
        return moveSubmarine(6,10);
        break;
      case 5:
        return moveSubmarine(10,14);
        break;
      case 6:
        return moveSubmarine(3,2);
        break;
      default:
        if (board.shark === 7 || board.shark === 11)
        {
          switch(board.turn){
            case 7:
              return moveSubmarine(2,3);
              break;
            case 8:
              return moveSubmarine(3,7);
              break;
            case 9:
              return moveSubmarine(7,11);
              break;
            //default:
          }
        }
        else
        {
          switch(board.turn){
            case 7:
              return moveSubmarine(2,1);
              break;
            case 8:
              return moveSubmarine(1,0);
              break;
            case 9:
              return moveSubmarine(0,4);
              break;
            case 10:
              return moveSubmarine(4,8);
              break;
            //default:
        }
        break;
      }
    }
  }
};

export const getGameStateAfterMove = (newBoard) => {
  return { newBoard, isGameEnd: isGameEnd(newBoard), winnerIndex: hasFirstPlayerWon(newBoard) ? 0 : 1 };
};

const isGameEnd = (board) => {
  return (board.shark === -1 || board.turn > 11);
};

const hasFirstPlayerWon = (board) => {
  return board.shark === -1;
};


const getOptimalAiPlacingPositionShark = (board, playerIndex) => {
  const possibleMoves = [];
  const isNextToSubmarine = (id) => {
    if (id+4 < 16 && board.board[id+4] === 'red') return true;
    if (id-4 >= 0 && board.board[id-4] === 'red') return true;
    if (id+1 < 16 && id%4 !== 3 && board.board[id+1] === 'red') return true;
    if (id-1 >= 0 && id%4 !== 0 && board.board[id-1] === 'red') return true;
    if (board.board[id] === 'red') return true;
    return false;
  }
  const distanceFromShark = (id) => {
    return Math.abs(board.shark%4-id%4) + Math.abs(Math.floor(board.shark/4)-Math.floor(id/4));
  }

  const visited = Array(16).fill(false);
  const visited2 = Array(16).fill(false);
  const componentSizes = Array(16).fill(0);
  const queue = [];
  let first;

  for (let i = 0; i<16; i++)
  {
    if (!visited[i] && !isNextToSubmarine(i))
    {
      queue.push(i);
      visited[i] = true;
      let counter = 0;
      while(queue.length > 0)
      {
        counter++;
        first = queue.shift();
        if (first+4 < 16 && !isNextToSubmarine(first+4) && visited[first+4] == false) {
          queue.push(first+4); visited[first+4]=true
        }
        if (first-4 >= 0 && !isNextToSubmarine(first-4) && visited[first-4] == false) {
          queue.push(first-4); visited[first-4]=true
        }
        if (first+1 < 16 && first%4 !== 3 && !isNextToSubmarine(first+1) && visited[first+1] == false) {
          queue.push(first+1); visited[first+1]=true
        }
        if (first-1 >= 0 && first%4 !== 0 && !isNextToSubmarine(first-1) && visited[first-1] == false) {
          queue.push(first-1); visited[first-1]=true
        }
      }
      queue.push(i);
      visited2[i] = true;
      while(queue.length > 0)
      {
        first = queue.shift();
        componentSizes[first] = counter;
        if (first+4 < 16 && !isNextToSubmarine(first+4) && visited2[first+4] == false) {
          queue.push(first+4); visited2[first+4] = true;
        }
        if (first-4 >= 0 && !isNextToSubmarine(first-4) && visited2[first-4] == false) {
          queue.push(first-4); visited2[first-4] = true;
        }
        if (first+1 < 16 && first%4 !== 3 && !isNextToSubmarine(first+1) && visited2[first+1] == false) {
          queue.push(first+1); visited2[first+1] = true;
        }
        if (first-1 >= 0 && first%4 !== 0 && !isNextToSubmarine(first-1) && visited2[first-1] == false) {
          queue.push(first-1); visited2[first-1] = true;
        }
      }
    }
  }

  let maxi = 1;
  for (let i = 0; i < 16; i++)
  {
    if (distanceFromShark(i) <=2)
    {
      if(maxi < componentSizes[i])
      {
        maxi = componentSizes[i];
      }
    }
  }

  for (let ind = 0; ind < 4; ind++)
  {
    let i = [5,6,9,10][ind];
    if (componentSizes[i] === maxi && distanceFromShark(i) <=2)
    {
      possibleMoves.push(i);
    }
  }
  if (possibleMoves.length === 0)
  {
    for (let ind = 0; ind < 8; ind++)
    {
      let i = [1,2,4,7,8,11,13,14][ind];
      if (componentSizes[i] == maxi && distanceFromShark(i) <=2)
      {
        possibleMoves.push(i);
      }
    }
  }
  if (possibleMoves.length === 0)
  {
    for (let ind = 0; ind < 4; ind++)
    {
      let i = [0,3,12,15][ind];
      if (componentSizes[i] == maxi && distanceFromShark(i) <=2)
      {
        possibleMoves.push(i);
      }
    }
  }
  if (possibleMoves.length === 0)
  {
    for (let i = 0; i <16; i++)
    {
      if (distanceFromShark(i) <=2 && board.board[i] !== 'red') possibleMoves.push(i);
    }
  }

  return possibleMoves[Math.floor(Math.random()*(possibleMoves.length))];
}
