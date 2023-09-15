import { State } from 'boardgame.io';
import { MyGameState } from './game';



export function strategyWrapper(category: "C" | "D" | "E")
{
  return (state: State<MyGameState>, botID: string): [number | {pile: number} | undefined, string] => {
    if(state.ctx.phase === "startNewGame") {
      return [startingPosition({G: state.G, ctx: state.ctx}, category), "setStartingPosition"];
    }
    
    if (state.G.pile%2 == 1) return [0, "changePile"];
    else if ((state.G.pile/2 %2 == 0 && state.G.pile !== 4) || state.G.pile === 6) return [0, "changePile"];
    else if (state.G.pile === 4) return [1, "changePile"];
    else return [undefined, "changePile"];
  }
}

function startingPosition({ G, ctx}: any, category: "C" | "D" | "E"): {pile: number} {
  return {pile:17};
  
}
