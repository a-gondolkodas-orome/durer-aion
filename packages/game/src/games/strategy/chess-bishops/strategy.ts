import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(_state: State<MyGameState>, _botID: string): [number | undefined, string] {
  return [undefined, "clickCell"];
}