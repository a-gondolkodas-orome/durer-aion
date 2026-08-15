import { type Board, applyShade, applyCircle } from '../gameplay';
import { botNextMove, makeCtx } from 'test-utils';
import type { BotStrategy } from 'strategy-game-factory';

// Ask a bot for one turn and report what it named, applying the move so tests
// can inspect the resulting board too.
export const playBotTurn = (board: Board, currentPlayer: number, strategy: BotStrategy<Board>) => {
  const ctx = makeCtx({
    phase: 'play',
    currentPlayer,
    isClientMoveAllowed: true
  });
  const { move, args = [] } = botNextMove(strategy({ board, ctx }));
  const arg = args[0] as number;
  return {
    move: move as 'shadeEdge' | 'placeCircle',
    arg,
    nextBoard: move === 'shadeEdge' ? applyShade(board, arg) : applyCircle(board, arg)
  };
};
