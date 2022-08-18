import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(state: State<MyGameState>, botID: string): [number|undefined, string] {
    return [undefined, "clickCell"];
}