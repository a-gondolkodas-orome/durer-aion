import { State } from 'boardgame.io';
import { MyGameState, Position } from './game';

export function strategy(state: State<MyGameState>, botID: string): [Position | undefined, string] {
  if(state.G.rookPosition[0] !== state.G.rookPosition[1]){
    // He is not on the the diagonal, we can step on a winning position
    let winningNumber = Math.max(state.G.rookPosition[0], state.G.rookPosition[1]);
    return [[winningNumber, winningNumber], "clickCell"];
  } else {
    // He is on a winning position, return random
    return [undefined, "clickCell"];
  }
}