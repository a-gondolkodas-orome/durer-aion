import { State } from 'boardgame.io';
import { GameStateMixin } from '../../../common/types';

export function strategy(_state: State<GameStateMixin>, _botID: string): [undefined, string] {
  return [undefined, ""];
}

export function startingPosition(_: Pick<State<GameStateMixin>, 'G' | 'ctx'>): {coins: number[]} {
  return {coins: [1,1,1,2,2,2,3,3,3,3]};
}