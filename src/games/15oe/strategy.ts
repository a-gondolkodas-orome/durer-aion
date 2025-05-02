import { State } from 'boardgame.io';
import { GameStateMixin } from '../../common/types';
import { MyGameState, Position } from './game';


export function strategy(state: State<MyGameState & GameStateMixin>, botID: string): [Position | undefined, string] {
  if(state.G.difficulty === "live"){
    return [undefined, "clickCell"]
  }
  else{
    return [undefined, "clickCell"];
  } 
}