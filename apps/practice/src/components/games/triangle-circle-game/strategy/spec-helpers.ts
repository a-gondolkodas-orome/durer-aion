import { type Board, applyShade, applyCircle } from '../helpers';
import { makeCtx } from '../../../../test-utils';
import type { Ctx, GameMoves } from '../../../strategy-game-factory';

type BotStrategy = (args: { board: Board; ctx: Ctx; moves: GameMoves<Board> }) => void;

// Drive a bot strategy for one turn and capture what it played, applying the
// move so tests can inspect the resulting board too.
export const playBotTurn = (board: Board, currentPlayer: number, strategy: BotStrategy) => {
  const captured: { move: 'shadeEdge' | 'placeCircle'; arg: number; nextBoard: Board } = {
    move: 'shadeEdge',
    arg: -1,
    nextBoard: board
  };
  const moves: GameMoves<Board> = {
    shadeEdge: (b: Board, edgeId: number) => {
      captured.move = 'shadeEdge';
      captured.arg = edgeId;
      captured.nextBoard = applyShade(b, edgeId);
      return { nextBoard: captured.nextBoard };
    },
    placeCircle: (b: Board, triangleId: number) => {
      captured.move = 'placeCircle';
      captured.arg = triangleId;
      captured.nextBoard = applyCircle(b, triangleId);
      return { nextBoard: captured.nextBoard };
    }
  };
  const ctx = makeCtx({
    phase: 'play',
    currentPlayer,
    isClientMoveAllowed: true
  });
  strategy({ board, ctx, moves });
  return captured;
};
