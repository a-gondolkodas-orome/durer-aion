import { State } from 'boardgame.io';
import { GameStateMixin } from '../../../common/types';

export function strategy(state: State<GameStateMixin>, botID: string): [undefined, string] {
  void state;
  void botID;
  return [undefined, ""];
}

export function startingPosition({ G, ctx}: any): {pile: number} {
  void G;
  void ctx;
  return {pile: 17};
}