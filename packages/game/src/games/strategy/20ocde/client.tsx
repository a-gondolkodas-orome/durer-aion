// The game as a team's browser plays it: its rules, board and description,
// without its bot. Imports nothing from beside it but ./game, ./board and
// ./main (eslint.config.mjs), since the live round is to serve this file alone,
// and only to a team that has started the game (#643).
import { MyGameWrapper } from './game';
import type { Category } from './game';
import { MyBoard } from './board';
import { descriptionC, descriptionD, descriptionE } from './main';

const descriptions = { C: descriptionC, D: descriptionD, E: descriptionE };

export function strategyClient(category: Category) {
  return { game: MyGameWrapper(category), board: MyBoard, description: descriptions[category] };
}
