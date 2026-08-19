import type { CompetitionGame } from '../competition-game';
import { generateTestStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { competitionStartBoardsC, competitionStartBoardsD } from './start-boards';

export const removeDivisorMultipleCompetition: CompetitionGame<Board> = {
  gameId: 'RemoveDivisorMultiple',
  gameplay: { moves },
  liveBot: smartBotStrategy,
  testBot: randomBotStrategy,
  liveStartBoardsByCategory: { C: competitionStartBoardsC, D: competitionStartBoardsD },
  generateTestStartBoard
};
