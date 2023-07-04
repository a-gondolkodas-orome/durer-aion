import { State } from 'boardgame.io';
import { GameStateMixin } from '../../common/types';

export function strategy(state: State<GameStateMixin>, botID: string): [undefined, string] {
  return [undefined, ""];
}

export function startingPosition({ G, ctx}: any): {coins: Array<number>} {
  return {coins: [1,1,1,2,2,2,3,3,3,3]};
}