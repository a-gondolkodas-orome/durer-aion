import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../common/types';


function possibleMoves(G: MyGameState) {
  let moves = [];
  if ((G.circle[1] || G.circle[G.circle.length-1]) && G.circle[0]) {
    moves.push({move: 'removePoint', args: [0]});
  }
  for (let i = 1; i<G.circle.length-1; i++) {
    if ((G.circle[i-1] || G.circle[i+1]) && G.circle[i]) {
      moves.push({move: 'removePoint', args: [i]});
    }
  }  
  if ((G.circle[0] || G.circle[G.circle.length-2]) && G.circle[G.circle.length-1]) {
    moves.push({move: 'removePoint', args: [G.circle.length-1]});
  }
  return moves;
}

export function strategyWrapper(category: "C" | "D" | "E") {
  return (state: State<MyGameState & GameStateMixin>, botID: string): [number | { circle: Array<boolean> } | undefined, string] => {
    if (state.ctx.phase === "startNewGame") {
      return [startingPosition({ G: state.G, ctx: state.ctx }, category), "setStartingPosition"];
    }

    if (state.G.difficulty === "test") {
      return randomStrategy(state.G);
    } else {
      return randomStrategy(state.G);
    }
  }
}

function startingPosition({ G, ctx }: any, category: "C" | "D" | "E"): { circle: Array<boolean>, firstMove: number, lastMove: number} {
  if (category === "C") {
    // C Category
    return { circle: Array(7).fill(true), firstMove:-1, lastMove:-1};
  }
  if (category === "D") {
    // D Category
    return { circle: Array(9).fill(true), firstMove:-1, lastMove:-1};
  }
  if (category === "E") {
    // E Category
    if (G.difficulty === "live") {
      let NoL = G.numberOfLoss;
      let WS = G.winningStreak;
      if (NoL === 0 && WS === 0) {
        return { circle: Array(9).fill(true), firstMove:-1, lastMove:-1};
      } else if (NoL === 0 && WS === 1) {
        return { circle: Array(10).fill(true), firstMove:-1, lastMove:-1};
      } else if (NoL === 1 && WS === 0) {
        return { circle: Array(8).fill(true), firstMove:-1, lastMove:-1};
      } else if (NoL === 1 && WS === 1) {
        return { circle: Array(9).fill(true), firstMove:-1, lastMove:-1};
      } else if (NoL === 2 && WS === 0) {
        return { circle: Array(7).fill(true), firstMove:-1, lastMove:-1};
      } else if (NoL === 2 && WS === 1) {
        return { circle: Array(10).fill(true), firstMove:-1, lastMove:-1};
      } else {
        return { circle: Array(
          6 + Math.floor(Math.random()*2)*2 + G.numberOfTries%2
        ).fill(true), firstMove:-1, lastMove:-1};
      }
    } else {
      return { circle: Array(Math.floor(Math.random()*4+7)).fill(true), firstMove:-1, lastMove:-1};
    }
  }
  //just in case
  return {circle: Array(7).fill(true), firstMove:-1, lastMove:-1};
}

function randomStrategy(G: MyGameState): [number, string] {
  let pMoves =  possibleMoves(G);
  let i = Math.floor(Math.random()*pMoves.length);
  return [pMoves[i].args[0], pMoves[i].move];
}

function winningStrategy(G: MyGameState): [number, string] {
  let pMoves: string | any[] = [];
  if (G.firstMove === -1) {
    pMoves = possibleMoves(G);
  }

  //TODO Implement strategy

  let i = Math.floor(Math.random()*pMoves.length);
  return [pMoves[i].args[0], pMoves[i].move];
}