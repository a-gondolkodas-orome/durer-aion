import type { BotStrategy, Gameplay } from './types';
import { playBotTurn, type MatchMove } from './play-bot-turn';
import { createInitialCoreState, type CoreState } from './store';

export type MatchResult<TBoard> = {
  winnerIndex: number
  board: TBoard
  history: MatchMove<TBoard>[]
}

// Plays a whole game outside React: two strategies, the real moves, the real
// reducer — so a game's spec plays its bots against each other without faking
// `moves` or re-implementing win detection. Each turn is played by playBotTurn,
// the same host a competition server uses, so the two cannot drift.
//
// Everything that goes wrong throws: unlike the shell, which must keep a live
// game playable, a headless match only ever runs in tests and CI, where a
// silent no-op would hide the bug it exists to catch.
export const runMatch = <TBoard, TTurnState = unknown>({
  gameplay,
  strategies,
  startBoard,
  maxMoves = 500
}: {
  gameplay: Gameplay<TBoard, TTurnState>
  // strategies[i] plays as player i
  strategies: [BotStrategy<TBoard>, BotStrategy<TBoard>]
  startBoard: TBoard
  maxMoves?: number
}): MatchResult<TBoard> => {
  let state: CoreState<TBoard, TTurnState> = {
    ...createInitialCoreState<TBoard, TTurnState>(startBoard),
    phase: 'play',
    currentPlayer: 0
  };
  const history: MatchMove<TBoard>[] = [];

  while (state.phase === 'play') {
    if (history.length >= maxMoves) {
      throw new Error(`runMatch: no game end after ${maxMoves} moves`);
    }
    const player = state.currentPlayer!;
    // Bots read `ctx.chosenRoleIndex` to learn which seat they hold, and in
    // vsComputer the bot is always the role the human did not choose. Both
    // seats here are bots, so the seat about to move is "the computer" and the
    // other one is the notional human.
    state = { ...state, chosenRoleIndex: 1 - player };
    const turn = playBotTurn(state, gameplay, strategies[player]!, { maxMoves });
    history.push(...turn.moves);
    state = turn.state;
  }

  return { winnerIndex: state.winnerIndex!, board: state.board, history };
};
