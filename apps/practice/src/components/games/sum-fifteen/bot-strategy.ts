import type { BotStrategy } from '../../strategy-game-factory';
import { chooseSmartMove, chooseTestMove, currentPlayerFromOwner, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseSmartMove(board.owner, player)] };
};

export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseTestMove(board.owner, player)] };
};
