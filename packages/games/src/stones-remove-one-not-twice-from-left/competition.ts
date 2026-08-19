import { cloneDeep, sample } from 'lodash';
import type { CompetitionGame } from '../competition-game';
import { moves, testStartBoards, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { competitionStartBoardsE } from './start-boards';

export const stonesRemoveOneNotTwiceFromLeftCompetition: CompetitionGame<Board> = {
  gameId: 'StonesRemoveOneNotTwiceFromLeft',
  gameplay: { moves },
  liveBot: smartBotStrategy,
  testBot: randomBotStrategy,
  liveStartBoardsByCategory: { E: competitionStartBoardsE },
  // Test games start from the practice Teszt variant's curated list; a test
  // attempt has no hand-out order to honor, so a random pick is right.
  generateTestStartBoard: () => cloneDeep(sample(testStartBoards)!)
};
