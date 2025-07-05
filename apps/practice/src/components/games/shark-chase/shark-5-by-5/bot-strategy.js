'use strict';

import { sample } from 'lodash';

export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (ctx.chosenRoleIndex === 0) {
    const finalPos = getNextSharkPositionByAI(board.submarines, board.shark);
    const firstPos = getIntermediateSharkPosition(board.submarines, board.shark, finalPos);
    const { nextBoard } = moves.moveShark(board, firstPos);
    if (finalPos !== board.shark) {
      setTimeout(() => {
        moves.moveShark(nextBoard, finalPos);
      }, firstPos === finalPos ? 0 : 750);
    }
  } else {
    const { from, to } = getOptimalSubmarineMoveByAi(board);
    moves.moveSubmarine(board, { from, to });
  }
};

const getOptimalSubmarineMoveByAi = (board) => {
  const submarineNextToShark = findSubmarineNextToShark(board);
  if (submarineNextToShark !== undefined) {
    return { from: submarineNextToShark, to: board.shark }
  }

  switch(board.turn){
    case 1:
      return { from: 8, to: 7 };
    case 2:
      return { from: 9, to: 14 };
    case 3:
      return { from: 14, to: 13 };
    case 4:
      return { from: 7, to: 6 };
    case 5:
      return { from: 6, to: 11 };
    case 6:
      return { from: 11, to: 16 };
    case 7:
      return { from: 13, to: 12 };
    case 8:
      return { from: 16, to: 21 };
		case 9:
			return { from: 4, to: 9 };
    default:
      if ( [0,1,5,6,10,15].includes(board.shark) ) {
        switch(board.turn) {
          case 10:
            return { from: 9, to: 8 };
          case 11:
            return { from: 8, to: 7 };
          case 12:
            return { from: 7, to: 6 };
          case 13:
            return { from: 6, to: 5 };
					case 14:
						if ( board.shark == 15 )
							return { from: 5, to: 10 };
						else
							return { from: 3, to: 2 };
        }
      } else {
        switch(board.turn){
          case 10:
            return { from: 9, to: 14 };
          case 11:
            return { from: 14, to: 19 };
          case 12:
            return { from: 0, to: 4 };
          case 13:
            return { from: 4, to: 8 };
					case 14:
						return { from: 21, to: 22 };
      }
      break;
    }
  }
};

const findSubmarineNextToShark = (board) => {
  if (board.shark+5 < 25 && board.submarines[board.shark+5] >= 1) return board.shark+5;
  if (board.shark-5 >= 0 && board.submarines[board.shark-5] >= 1) return board.shark-5;
  if (board.shark+1 < 25 && board.shark%5 !== 4 && board.submarines[board.shark+1] >= 1) return board.shark+1;
  if (board.shark-1 >= 0 && board.shark%5 !== 0 && board.submarines[board.shark-1] >= 1) return board.shark-1;
  return undefined;
};

const distanceFromShark = (shark, id) => {
  return (
    Math.abs((shark % 5) - (id % 5)) +
    Math.abs(Math.floor(shark / 5) - Math.floor(id / 5))
  );
}

export const getNextSharkPositionByAI = (submarines, shark) => {
  const componentSizes = getComponentSizes(submarines)

  // 2 lepessel elerheto mezo aminek legnagyobb az osszefuggosegi komponense
  let maxi = 1;
  for (let i = 0; i < 25; i++) {
    if (isReachableWithoutDeath(submarines, shark, i)) {
      if(maxi < componentSizes[i]) {
        maxi = componentSizes[i];
      }
    }
  }

  const possibleMoves = [];

	// kozepso mezo
  {
		let i = 12;
    if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
      possibleMoves.push(i);
    }
	}

  // nem sarkok a kozepso koron
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 4; ind++) {
      let i = [7,11,13,17][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // kozepso kor sarkai
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 4; ind++) {
      let i = [6,8,16,18][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // kulso kor kozeőpso mezoi
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 4; ind++) {
      let i = [2,10,14,22][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }
	
  // kulso kor masodik es negyedik mezoi
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 8; ind++) {
      let i = [1,3,5,9,15,19,21,23][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // sarkok
  if (possibleMoves.length === 0) {
    for (let ind = 0; ind < 4; ind++) {
      let i = [0,4,20,24][ind];
      if (componentSizes[i] == maxi && isReachableWithoutDeath(submarines, shark, i)) {
        possibleMoves.push(i);
      }
    }
  }

  // ha nincs mas lehetoseg, legalabb ne lepjunk azonnal tengeralattjarora
  if (possibleMoves.length === 0) {
    for (let i = 0; i <25; i++) {
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
    if (id === shark - 2 && submarines[shark - 1] >= 1) return false;	// bal
    if (id === shark + 2 && submarines[shark + 1] >= 1) return false;	// jobb
    if (id === shark + 10 && submarines[shark + 5] >= 1) return false;// lent
    if (id === shark - 10 && submarines[shark - 5] >= 1) return false;// fent
    if (id === shark - 6 && (submarines[shark - 5] >= 1 && submarines[shark - 1] >= 1)) return false; // bal fent
    if (id === shark + 4 && (submarines[shark + 5] >= 1 && submarines[shark - 1] >= 1)) return false; // bal lent
    if (id === shark + 6 && (submarines[shark + 5] >= 1 && submarines[shark + 1] >= 1)) return false; // jobb lent
    if (id === shark - 4 && (submarines[shark - 5] >= 1 && submarines[shark + 1] >= 1)) return false; // jobb fent
  }
  return true;
}

const getIntermediateSharkPosition = (submarines, shark, id) => {
  if (id === shark - 2) return shark - 1;
  if (id === shark + 2) return shark + 1;
  if (id === shark + 10) return shark + 5;
  if (id === shark - 10) return shark - 5;
  if (id === shark - 6 && submarines[shark - 5] >= 1) return shark - 1;
  if (id === shark + 4 && submarines[shark + 5] >= 1) return shark - 1;
  if (id === shark + 6 && submarines[shark + 5] >= 1) return shark + 1;
  if (id === shark - 4 && submarines[shark - 5] >= 1) return shark + 1;
  if (id === shark - 6 && submarines[shark - 1] >= 1) return shark - 5;
  if (id === shark + 4 && submarines[shark - 1] >= 1) return shark + 5;
  if (id === shark + 6 && submarines[shark + 1] >= 1) return shark + 5;
  if (id === shark - 4 && submarines[shark + 1] >= 1) return shark - 5;
  if (id === shark - 6) return shark - 5;
  if (id === shark + 4) return shark + 5;
  if (id === shark + 6) return shark + 5;
  if (id === shark - 4) return shark - 5;
  return id;
}

// osszefuggosegi komponensek a tengeralattjarokkal nem kozvetlen szomszedos mezokbol
const getComponentSizes = (submarines) => {
  const isNextToSubmarine = (id) => {
    if (id+5 < 25 && submarines[id+5] >= 1) return true;
    if (id-5 >= 0 && submarines[id-5] >= 1) return true;
    if (id+1 < 25 && id%5 !== 4 && submarines[id+1] >= 1) return true;
    if (id-1 >= 0 && id%5 !== 0 && submarines[id-1] >= 1) return true;
    if (submarines[id] >= 1) return true;
    return false;
  }

  const visited = Array(25).fill(false);
  const visited2 = Array(25).fill(false);
  const componentSizes = Array(25).fill(0);
  const queue = [];
  let first;

  for (let i = 0; i<25; i++)
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
        if (first+5 < 25 && !isNextToSubmarine(first+5) && visited[first+5] == false) {
          queue.push(first+5); visited[first+5]=true
        }
        if (first-5 >= 0 && !isNextToSubmarine(first-5) && visited[first-5] == false) {
          queue.push(first-5); visited[first-5]=true
        }
        if (first+1 < 25 && first%5 !== 4 && !isNextToSubmarine(first+1) && visited[first+1] == false) {
          queue.push(first+1); visited[first+1]=true
        }
        if (first-1 >= 0 && first%5 !== 0 && !isNextToSubmarine(first-1) && visited[first-1] == false) {
          queue.push(first-1); visited[first-1]=true
        }
      }
      queue.push(i);
      visited2[i] = true;
      while(queue.length > 0)
      {
        first = queue.shift();
        componentSizes[first] = counter;
        if (first+5 < 25 && !isNextToSubmarine(first+5) && visited2[first+5] == false) {
          queue.push(first+5); visited2[first+5] = true;
        }
        if (first-5 >= 0 && !isNextToSubmarine(first-5) && visited2[first-5] == false) {
          queue.push(first-5); visited2[first-5] = true;
        }
        if (first+1 < 25 && first%5 !== 4 && !isNextToSubmarine(first+1) && visited2[first+1] == false) {
          queue.push(first+1); visited2[first+1] = true;
        }
        if (first-1 >= 0 && first%5 !== 0 && !isNextToSubmarine(first-1) && visited2[first-1] == false) {
          queue.push(first-1); visited2[first-1] = true;
        }
      }
    }
  }
  return componentSizes;
}
