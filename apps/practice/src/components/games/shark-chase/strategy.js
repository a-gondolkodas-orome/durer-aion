'use strict';

import { cloneDeep, sample } from 'lodash';

export const getGameStateAfterMove = (nextBoard) => {
  return {
    nextBoard,
    isGameEnd: nextBoard.submarines[nextBoard.shark] >= 1 || nextBoard.turn > 11,
    winnerIndex: nextBoard.submarines[nextBoard.shark] >= 1 ? 0 : 1
  };
};

export const getGameStateAfterAiTurn = ({ board, ctx }) => {
  const nextBoard = cloneDeep(board);

  if (ctx.chosenRoleIndex === 0) {
    nextBoard.shark = getNextSharkPositionByAI(board.submarines, board.shark);
  } else {
    const { from, to } = getOptimalSubmarineMoveByAi(board);
    nextBoard.submarines[from] -= 1;
    nextBoard.submarines[to] += 1;
  }
  return getGameStateAfterMove(nextBoard);
};

const getOptimalSubmarineMoveByAi = (board) => {
  const submarineNextToShark = findSubmarineNextToShark(board);
  if (submarineNextToShark !== undefined) {
    return { from: submarineNextToShark, to: board.shark }
  }

  switch(board.turn){
    case 1:
      return { from: 2, to: 1 };
    case 2:
      return { from: 1, to: 5 };
    case 3:
      return { from: 7, to: 6 };
    case 4:
      return { from: 6, to: 10 };
    case 5:
      return { from: 10, to: 14 };
    case 6:
      return { from: 3, to: 2 };
    default:
      if (board.shark === 7 || board.shark === 11) {
        switch(board.turn) {
          case 7:
            return { from: 2, to: 3 };
          case 8:
            return { from: 3, to: 7 };
          case 9:
            return { from: 7, to: 11 };
        }
      } else {
        switch(board.turn){
          case 7:
            return { from: 2, to: 1 };
          case 8:
            return { from: 1, to: 0 };
          case 9:
            return { from: 0, to: 4 };
          case 10:
            return { from: 4, to: 8 };
      }
      break;
    }
  }
};

const findSubmarineNextToShark = (board) => {
  if (board.shark+4 < 16 && board.submarines[board.shark+4] >= 1) return board.shark+4;
  if (board.shark-4 >= 0 && board.submarines[board.shark-4] >= 1) return board.shark-4;
  if (board.shark+1 < 16 && board.shark%4 !== 3 && board.submarines[board.shark+1] >= 1) return board.shark+1;
  if (board.shark-1 >= 0 && board.shark%4 !== 0 && board.submarines[board.shark-1] >= 1) return board.shark-1;
  return undefined;
};

const distanceFromShark = (shark, id) => {
  return (
    Math.abs((shark % 4) - (id % 4)) +
    Math.abs(Math.floor(shark / 4) - Math.floor(id / 4))
  );
}

export const getNextSharkPositionByAI = (submarines, shark) => {
  const componentSizes = getComponentSizes(submarines)

  // 2 lepessel elerheto mezo aminek legnagyobb az osszefuggosegi komponense
  let maxi = 1;
  for (let i = 0; i < 16; i++) {
    if (isReachableWithoutDeath(submarines, shark, i)) {
      if(maxi < componentSizes[i]) {
        maxi = componentSizes[i];
      }
    }
  }

  const possibleMoves = [];

  // 4 kozepso mezo
  for (let ind = 0; ind < 4; ind++) {
    let i = [5,6,9,10][ind];
    if (componentSizes[i] === maxi && isReachableWithoutDeath(submarines, shark, i)) {
      possibleMoves.push(i);
    }
  }

  // szelek de nem sarkok
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 8; ind++) {
      let i = [1,2,4,7,8,11,13,14][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // sarkok
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 4; ind++) {
      let i = [0,3,12,15][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // ha nincs mas lehetoseg, legalabb ne lepjunk azonnal tengeralattjarora
  if (possibleMoves.length === 0) {
    for (let i = 0; i <16; i++) {
      if (isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  return sample(possibleMoves);
}

const isReachableWithoutDeath = (submarines, shark, id) => {
  if (distanceFromShark(shark, id) > 2) return false;
  if (submarines[id] >= 1) return false;
  if (distanceFromShark(shark, id) === 2) {
    if (id === shark - 2 && submarines[shark - 1] >= 1) return false;
    if (id === shark + 2 && submarines[shark + 1] >= 1) return false;
    if (id === shark + 8 && submarines[shark + 4] >= 1) return false;
    if (id === shark - 8 && submarines[shark - 4] >= 1) return false;
    if (id === shark - 5 && (submarines[shark - 4] >= 1 || submarines[shark - 1] >= 1)) return false;
    if (id === shark + 3 && (submarines[shark + 4] >= 1 || submarines[shark - 1] >= 1)) return false;
    if (id === shark + 5 && (submarines[shark + 4] >= 1 || submarines[shark + 1] >= 1)) return false;
    if (id === shark - 3 && (submarines[shark - 4] >= 1 || submarines[shark + 1] >= 1)) return false;
  }
  return true;
}

// osszefuggosegi komponensek a tengeralattjarokkal nem kozvetlen szomszedos mezokbol
const getComponentSizes = (submarines) => {
  const isNextToSubmarine = (id) => {
    if (id+4 < 16 && submarines[id+4] >= 1) return true;
    if (id-4 >= 0 && submarines[id-4] >= 1) return true;
    if (id+1 < 16 && id%4 !== 3 && submarines[id+1] >= 1) return true;
    if (id-1 >= 0 && id%4 !== 0 && submarines[id-1] >= 1) return true;
    if (submarines[id] >= 1) return true;
    return false;
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
  return componentSizes;
}
