import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../common/types';
import { strategyDict, StrategyDict } from './strategydict';
import { possibleMoves } from './game';

export function strategyWrapper(category: "C" | "D") {
  return (state: State<MyGameState & GameStateMixin>, botID: string): [number | { line: Array<boolean> } | undefined, string] => {
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

function startingPosition({ G, ctx }: any, category: "C" | "D"): { line: Array<boolean>, previousMove: number} {
  if (category === "C") {
    if (G.difficulty === "live") {
      if (G.winningStreak % 2 === 0) {
        return { line: Array(6).fill(true), previousMove:-1};
      } else {
        return { line: Array(7).fill(true), previousMove:-1};
      }
    } else {
      return { line: Array(Math.floor(Math.random()*2+6)).fill(true), previousMove:-1};
    }
  }
  if (category === "D") {
    if (G.difficulty === "live") {
      if (G.winningStreak % 2 === 0) {
        return { line: Array(10).fill(true), previousMove:-1};
      } else {
        return { line: Array(11).fill(true), previousMove:-1};
      }
    } else {
      return { line: Array(Math.floor(Math.random()*2+10)).fill(true), previousMove:-1};
    }
  }
  
  throw new Error("Invalid category");
}

function randomStrategy(G: MyGameState): [number, string] {
  let pMoves =  possibleMoves(G);
  let i = Math.floor(Math.random()*pMoves.length);
  return [pMoves[i].args[0], pMoves[i].move];
}

function generateStateID(line: Array<boolean>, previousMove: number): string {
  let id = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i]){
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
