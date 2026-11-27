// The game as a team's browser plays it — see 20ocde/client.tsx.
import { MyGameWrapper } from './game';
import { MyBoard } from './board';
import { description } from './main';

export function strategyClient() {
  return { game: MyGameWrapper(), board: MyBoard, description };
}
