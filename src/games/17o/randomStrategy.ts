import { State } from 'boardgame.io';
import { GameStateMixin } from '../../common/types';

export function strategy(state: State<GameStateMixin>, botID: string): [undefined, string] {
  return [undefined, ""];
}

export function startingPosition({ G, ctx}: any): {pile: number} {
  return {pile: 17};
}