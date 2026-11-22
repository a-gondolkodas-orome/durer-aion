// The game without its bot: the live round serves this file alone (#643).
import { MyGameWrapper } from './game';
import type { Category } from './game';
import { MyBoard } from './board';
import { descriptionC, descriptionD, descriptionE } from './main';

const descriptions = { C: descriptionC, D: descriptionD, E: descriptionE };

export function strategyClient(category: Category) {
  return { game: MyGameWrapper(category), board: MyBoard, description: descriptions[category] };
}
