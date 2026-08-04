import type { BotMove, BotStrategy } from '../../strategy-game-factory';
import { getRandomBotStep, getSmartBotStep, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

const asTurn = ({ keepId, parts }: { keepId: number; parts: number[] }): BotMove<Moves>[] => [
  { move: 'keepPile', args: [keepId] },
  { move: 'splitPile', args: [parts] }
];

export const smartBotStrategy: Bot = ({ board }) => asTurn(getSmartBotStep(board));

export const randomBotStrategy: Bot = ({ board }) => asTurn(getRandomBotStep(board));
