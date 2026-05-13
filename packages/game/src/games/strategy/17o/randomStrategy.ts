import { State } from 'boardgame.io';
import { GameStateMixin } from '../../../common/types';

export function strategy(state: State<GameStateMixin>, botID: string): [undefined, string] {
  if (!state || !botID) {
    console.error('Unimplemented.');
  }
  return [undefined, ""];
}

export function startingPosition({ G, ctx}: any): {pile: number} {
  if (!G || !ctx) {
    console.error('Unimplemented.');
  }
  return {pile: 17};
}