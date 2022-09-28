import { State } from 'boardgame.io';
import { GameStateMixin } from '../../common/types';
import { MyGameState, Cell } from './game';


export function strategy(state: State<MyGameState & GameStateMixin>, botID: string): [Cell | undefined, string] {
  if(state.G.difficulty === "live"){
    return [undefined, "clickCell"];
  }
  else{
    return [undefined, "clickCell"];
  } 
}