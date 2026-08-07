import type { BotStrategy } from 'strategy-game-factory';
import { sample } from 'lodash';
import { boardAfterRemoval, openPiles, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// A position is decided by the two pile sizes plus who is currently barred from
// the left pile — the seat numbers themselves say nothing, so both seats share
// one entry. Every move takes a stone away, so the reachable states are bounded
// by the start board: the largest, 11 and 8 stones, gives 12 × 9 × 4 of them.
const cache = new Map<string, boolean>();

const cacheKey = (board: Board, player: number) =>
  `${board.piles[0]},${board.piles[1]},`
    + `${+board.leftRestriction[player]!}${+board.leftRestriction[1 - player]!}`;

// Does the player to move win with perfect play? The game is small enough to
// solve exactly, so the bot needs no parity rule of thumb: it asks this of every
// position it could move to and picks one the opponent cannot win from.
//
// Losing by being unable to move is the game's only ending, so it needs no
// branch of its own here — a player with no legal moves has nothing to win with,
// which is what `some` over an empty list already says.
export const isWinningForMover = (board: Board, player: number): boolean => {
  const key = cacheKey(board, player);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const result = openPiles(board, player).some(
    pileId => isWinningRemoval(board, player, pileId)
  );
  cache.set(key, result);
  return result;
};

// A move wins exactly when it hands the opponent a position they cannot win.
const isWinningRemoval = (board: Board, player: number, pileId: number): boolean =>
  !isWinningForMover(boardAfterRemoval(board, player, pileId), 1 - player);

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const player = ctx.currentPlayer!;
  const options = openPiles(board, player);
  const winning = options.filter(pileId => isWinningRemoval(board, player, pileId));
  // From a lost position every move loses, so play on and let the opponent err.
  return { move: 'removeStone', args: [sample(winning.length ? winning : options)!] };
};

export const randomBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'removeStone', args: [sample(openPiles(board, ctx.currentPlayer!))!] });
