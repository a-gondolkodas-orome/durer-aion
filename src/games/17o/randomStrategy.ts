import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../common/types';

/// Strategy for frontend-only
export function strategyWrapper(category: "C" | "D" | "E") {
  return (state: State<MyGameState>, botID: string): [number | {pile: number} | undefined, string] => {
    if(state.ctx.phase === "startNewGame") {
      return [startingPosition({G: state.G, ctx: state.ctx}, category), "setStartingPosition"];
    }
    return [undefined, "changePile"];
  }
}

function startingPosition({ G, ctx }: any, category: "C" | "D" | "E"): { pile: number } {
  return {pile: 17};
}
