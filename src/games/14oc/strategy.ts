import { State } from 'boardgame.io';
import { GameStateMixin } from '../../common/types';
import { MyGameState, Position } from './game';


export function strategy(state: State<MyGameState & GameStateMixin>, botID: string): [Position | undefined, string] {
  if(state.G.difficulty === "live"){
    if(state.G.rookPosition[0] !== state.G.rookPosition[1]){
      // He is not on the the diagonal, we can step on a winning position
      let winningNumber = Math.max(state.G.rookPosition[0], state.G.rookPosition[1]);
      return [[winningNumber, winningNumber], "clickCell"];
    } else {
      // He is on a winning position, return random with maximum 3 steps
      let randomNumber = Math.floor(2*Math.random());
      if(randomNumber === 0){
        return [[state.G.rookPosition[0]+Math.floor(Math.min(3,7-state.G.rookPosition[0])*Math.random()+1),state.G.rookPosition[1]],"clickCell"];
      }
      else{
        return [[state.G.rookPosition[0],state.G.rookPosition[1]+Math.floor(Math.min(3,7-state.G.rookPosition[1])*Math.random()+1)],"clickCell"];
      }
    }
  }
  else{
    return [undefined, "clickCell"];
  } 
}