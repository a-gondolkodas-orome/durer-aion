import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import {
  allMoves, applyBreak, grundy, hasSafeBreak, type Board, type Move, type Moves, type Piece
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

// The board is a disjunctive sum of independent pieces, so it is losing for the
// player to move exactly when the XOR of the piece values is 0. Nothing on the
// rules side needs this — only the strategy does, which is why it lives here
// and `grundy` itself does not.
export const totalGrundy = (pieces: Piece[]): number =>
  pieces.reduce((acc, p) => acc ^ grundy(p.w, p.h), 0);

const winningMoves = (board: Board): Move[] =>
  allMoves(board.pieces).filter(m => totalGrundy(applyBreak(board, m).pieces) === 0);

// Optimal play: if the position is winning, move to a total Grundy value of 0
// (leaving the other player in a losing position). In a losing position, play
// the move that leaves the other player the fewest winning replies, maximising
// the chance they fail to punish it.
export const getSmartBotMove = (board: Board): Move => {
  const winning = winningMoves(board);
  if (winning.length > 0) return sample(winning)!;

  const moves = allMoves(board.pieces);
  const scored = moves.map(m => ({ m, oppWins: winningMoves(applyBreak(board, m)).length }));
  const minOppWins = Math.min(...scored.map(s => s.oppWins));
  const candidates = scored.filter(s => s.oppWins === minOppWins).map(s => s.m);
  return sample(candidates)!;
};

// Test bot: plays a random safe break, but grabs an immediate win (a move that
// leaves the other player unable to break safely) if one is available.
export const getRandomBotMove = (board: Board): Move => {
  const moves = allMoves(board.pieces);
  const immediateWins = moves.filter(m => !hasSafeBreak(applyBreak(board, m).pieces));
  return sample(immediateWins.length > 0 ? immediateWins : moves)!;
};

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'breakPiece', args: [getSmartBotMove(board)] });

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'breakPiece', args: [getRandomBotMove(board)] });
