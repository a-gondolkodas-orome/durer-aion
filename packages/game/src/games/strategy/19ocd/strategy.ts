import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../../common/types';
import { strategyDict, StrategyDict } from './strategydict';
import { possibleMoves } from './game';

export function strategyWrapper(category: "C" | "D") {
  return (state: State<MyGameState & GameStateMixin>, botID: string): [number | MyGameState | undefined, string] => {
    if (state.ctx.phase === "startNewGame") {
      return [startingPosition({ G: state.G, ctx: state.ctx }, category), "setStartingPosition"];
    }

    if (state.G.difficulty === "test") {
      return randomStrategy(state.G);
    } else {
      return winningStrategy(state.G);
    }
  }
}

function startingPosition({ G, ctx }: any, category: "C" | "D"): MyGameState | undefined {
  if (category === "C") {
    if (G.difficulty === "live") {
      if (G.winningStreak % 2 === 0) {
        return { numbersOnTable: Array(6).fill(true), previousMove:-1};
      } else {
        return { numbersOnTable: Array(7).fill(true), previousMove:-1};
      }
    } else {
      return { numbersOnTable: Array([3,4,5,8,9][Math.floor(Math.random()*5)]).fill(true), previousMove:-1};
    }
  }
  if (category === "D") {
    if (G.difficulty === "live") {
      if (G.winningStreak % 2 === 0) {
        return { numbersOnTable: Array(10).fill(true), previousMove:-1};
      } else {
        return { numbersOnTable: Array(11).fill(true), previousMove:-1};
      }
    } else {
      return { numbersOnTable: Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13][Math.floor(Math.random()*11)]).fill(true), previousMove:-1};
    }
  }
  
  throw new Error("Invalid category");
}

function randomStrategy(G: MyGameState): [number, string] {
  let pMoves =  possibleMoves(G);
  let i = Math.floor(Math.random()*pMoves.length);
  return [pMoves[i].args[0], pMoves[i].move];
}

function generateStateID(numbersOnTable: Array<boolean>, previousMove: number): string {
  let id = 0
  for (let i = 0; i < numbersOnTable.length; i++) {
    if (numbersOnTable[i]){
      id += 2**(i)
    }
  }
  return previousMove+"_"+id;
}


function winningStrategy(G: MyGameState): [number, string] {
  try {
    let pMoves = strategyDict[G.numbersOnTable.length][generateStateID(G.numbersOnTable, G.previousMove)];
    let i = Math.floor(Math.random()*pMoves.length);
    return [pMoves[i], "removeNumber"];
  } catch (e) {
    console.error("Winning strategy not found, using random strategy instead.");
    return randomStrategy(G);
  }
}
