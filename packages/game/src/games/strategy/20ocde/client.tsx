// The game without its bot: the live round serves this file alone (#643).
import { MyGameWrapper } from './game';
import type { Category } from './game';
import { MyBoard } from './board';
import { descriptionC, descriptionD, descriptionE } from './main';

const categories: Record<string, Category> = { '20o-c': 'C', '20o-d': 'D', '20o-e': 'E' };
const descriptions = { C: descriptionC, D: descriptionD, E: descriptionE };

export function strategyClient(gameId: string) {
  const category = categories[gameId];
  if (category === undefined) throw new Error(`20ocde plays no game ${gameId}`);
  return { game: MyGameWrapper(category), board: MyBoard, description: descriptions[category] };
}
