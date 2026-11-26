import type { State } from 'boardgame.io';
import { startingPositionMove, type GameStateMixin } from '../../../common/types';
import { PHASE } from '../../../common/gamewrapper';
import { maxTake, possibleMoves, startingPosition } from './game';
import type { MyGameState } from './game';

type GameState = State<MyGameState & GameStateMixin>;
type StrategyResult = [[number] | [number, number] | [MyGameState], string];

const memo = new Map<string, boolean>();

/// Whether the player to move wins from these piles with perfect play, when it
/// takes at most `mine` and the other player at most `theirs`. The state space
/// is a few dozen positions, so the bot searches it rather than read a table.
export function wins(piles: readonly number[], mine: number, theirs: number): boolean {
  const key = `${piles.join(',')}|${mine}|${theirs}`;
  const known = memo.get(key);
  if (known !== undefined) return known;
  let result = false;
  for (let pile = 0; pile < piles.length && !result; pile++) {
    for (let count = 1; count <= Math.min(mine, piles[pile]) && !result; count++) {
      const next = piles.map((size, i) => i === pile ? size - count : size);
      result = next.every(size => size === 0) || !wins(next, theirs, mine);
    }
  }
  memo.set(key, result);
  return result;
}

function pick<T>(choices: readonly T[]): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

/// The next step of a take, as a team plays it: choosing the pile, then taking
/// from it, so the team sees which pile the bot chose before it takes. The bot
/// is asked again once the pile is chosen, and `possibleMoves` then holds only
/// takes from that pile.
function nextStep(G: MyGameState, [pile, count]: [number, number]): StrategyResult {
  return G.selectedPile === pile ? [[pile, count], 'take'] : [[pile], 'selectPile'];
}

export function randomStrategy(state: GameState): StrategyResult {
  const moves = possibleMoves(state.G, state.ctx);
  if (moves.length === 0) throw new Error('No legal move in ketkupac');
  return nextStep(state.G, pick(moves).args);
}

/// A winning take if there is one, else any: a losing position has no better
/// move, only a chance that the team errs.
export function winningStrategy(state: GameState): StrategyResult {
  const { G, ctx } = state;
  const mine = maxTake(G, ctx.currentPlayer);
  const theirs = mine === 3 ? 4 : 3;
  const winning = possibleMoves(G, ctx).filter(({ args: [pile, count] }) => {
    const next = G.piles.map((size, i) => i === pile ? size - count : size);
    return next.every(size => size === 0) || !wins(next, theirs, mine);
  });
  if (winning.length === 0) return randomStrategy(state);
  return nextStep(G, pick(winning).args);
}

export function strategyWrapper() {
  return (state: GameState, _botID: string): StrategyResult => {
    if (state.ctx.phase === PHASE.startNewGame) return startingPositionMove<MyGameState>(startingPosition());
    return state.G.difficulty === 'test' ? randomStrategy(state) : winningStrategy(state);
  };
}
