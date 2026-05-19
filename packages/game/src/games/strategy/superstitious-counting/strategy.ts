import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(_state: State<MyGameState>, _botID: string): [number | undefined, string] {
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);
  return [undefined, "increaseNumber"];
}