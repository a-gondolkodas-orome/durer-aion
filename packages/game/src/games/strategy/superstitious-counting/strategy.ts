import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(state: State<MyGameState>, botID: string): [number | undefined, string] {
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);
  return [undefined, "increaseNumber"];
}