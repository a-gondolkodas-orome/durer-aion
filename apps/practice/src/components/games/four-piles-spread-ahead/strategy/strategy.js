'use strict';

import { random } from 'lodash-es';

let up=9;
export const generateNewBoard = () => ([random(0, up), random(0, up), random(0, up), random(4, up)]);

export const isTheLastMoverTheWinner = true;

export const getGameStateAfterAiMove = (board) => {
  return getGameStateAfterMove(board, getAiStep(board));
};

export const getGameStateAfterMove = (board, { pileId, pieceId }) => {

  let newBoard=board;
  newBoard[pileId]=board[pileId]-pieceId-1;
  for (let i=pileId-pieceId-1; i<pileId; i++){
    newBoard[i]=board[i]+1;
  }

  return { board: newBoard, isGameEnd: newBoard[1]===0 && newBoard[2]===0 && newBoard[3]===0 };
};

const getAiStep = (board) => {
let pileId, pieceId;
  if((board[1] % 2 === 0) && (board[3] % 5 === 3)){
    pileId=3;
    pieceId=random(0,1);
}else if((board[1] % 2 === 0) && (board[3] % 5 === 4)){
    pileId=3;
    pieceId=2;
} else if((board[1] % 2 === 0) && (board[3] % 5 === 1)){
    let undone=true;
    while(undone){
        pileId=random(1,3);
        if(board[pileId]>0){
            undone=false;
            pieceId=0;
            if ((pileId === 2) && (board[pileId]>1)){
                pieceId=random(0,1);
            }
        }
    }
}else if((board[1] % 2 === 1 ) && (board[3] % 5 === 3)){
    pileId=3;
    pieceId=2;
}else if((board[1] % 2 === 1) && (board[3] % 5 === 4)){
    pileId=3;
    pieceId=1;
}else if((board[1] % 2 === 1) && (board[3] % 5 === 0)){
    let undone=true;
    if(board[3]>2){
        while(undone){
            pileId=random(1,3);
            if(board[pileId]>0){
                undone=false;
                if(pileId===3){pieceId=2;}
                if(pileId===1){pieceId=0;}
                if (pileId===2){ if(board[pileId]>1){pieceId=random(0,1);} else{pieceId=0;}}
            }
        }
    }
    else{
        while(undone){
            pileId=random(1,2);
            if(board[pileId]>0){
                undone=false;
                if(pileId === 1){pieceId=0;}
                if (pileId === 2){ if(board[pileId]>1){pieceId=random(0,1);} else{pieceId=0;}}
            }
        }
    }
}else if((board[1] % 2 === 1) && (board[3] % 5 === 2)){
    let undone=true;
    while(undone){
        pileId=random(1,3);
        if(board[pileId]>0){
            undone=false;
            if (pileId === 3) {
                if (board[pileId]>1) {
                    pieceId=random(0,1);
                } else {
                    pieceId=0;
                }
            }
            if (pileId === 1) {
                pieceId=0;
            }
            if (pileId === 2) {
                if(board[pileId]>1) {
                    pieceId=random(0,1);
                } else {
                    pieceId=0;
                }
            }
        }
    }
}else{
    let undone=true;
    while(undone){
        pileId=random(1,3);
        if(board[pileId]>0){
            undone=false;
            pieceId=random(0, Math.min(pileId-1, board[pileId]-1));
        }
    }
}

return { pileId, pieceId };
};
