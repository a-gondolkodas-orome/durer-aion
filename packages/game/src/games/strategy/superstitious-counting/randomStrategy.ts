import { State } from 'boardgame.io';
import { GameStateMixin } from '../../../common/types';

export function strategy(_state: State<GameStateMixin>, _botID: string): [undefined, string] {
  return [undefined, ""];
}