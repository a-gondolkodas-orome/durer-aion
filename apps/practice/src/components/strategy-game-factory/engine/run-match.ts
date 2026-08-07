import type { BotStrategy, Gameplay } from '../types';
import { buildCtx } from './build-ctx';
import { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './bot-turn';
import { reduceMove } from './reducer';
import { createInitialCoreState, type CoreState } from './store';

export type MatchMove<TBoard> = {
  player: number
  move: string
  args: unknown[]
  // the board the move produced, so a test can judge a position without
  // re-implementing the move it came from
  board: TBoard
}

export type MatchResult<TBoard> = {
  winnerIndex: number
  board: TBoard
  history: MatchMove<TBoard>[]
}

// Names only ever reach presentation code; a headless match has no players to
// name, so any placeholder does.
const PLAYER_NAMES: [string, string] = ['0', '1'];

// Plays a whole game outside React: two strategies, the real moves, the real
// reducer. This is the browser-free half of the match loop an authoritative
// competition server needs (issue #313) — issue a start
// board, validate every move, drive the bot, detect the end — and, today, the
// way a game's spec plays its bots against each other without faking `moves`
// or re-implementing win detection.
//
// Everything that goes wrong throws: unlike the shell, which must keep a live
// game playable, a headless match only ever runs in tests and CI, where a
// silent no-op would hide the bug it exists to catch.
export const runMatch = <TBoard, TTurnState = unknown>({
  gameplay: { moves, endOfTurnMove },
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

  const play = (name: string, args: unknown[]) => {
    if (!moves[name]) throw new Error(unknownMoveMessage(name, moves));
    const transition = reduceMove(state, moves[name]!, name, args, PLAYER_NAMES);
    if (transition.illegal) {
      throw new Error(`runMatch: illegal move ${name}(${JSON.stringify(args)}) `
        + `rejected on board ${JSON.stringify(state.board)}`);
    }
    history.push({
      player: state.currentPlayer!, move: name, args, board: transition.result.nextBoard
    });
    state = transition.state;
    // The shell delays the auto endOfTurnMove only to animate it; headless
    // there is nothing to animate, so it runs straight away.
    if (endOfTurnMove && transition.autoEndOfTurn) {
      play(endOfTurnMove, []);
    }
  };

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
    const named = asBotMoves(
      strategies[player]({ board: state.board, ctx: buildCtx(state, PLAYER_NAMES) })
    );
    if (!named.length) {
      throw new Error(`runMatch: the strategy of player ${player} named no move`);
    }
    for (const [i, { move, args = [] }] of named.entries()) {
      if (i > 0 && !isBotTurnUnfinished(state, player)) {
        // A turn planned as a whole may win partway through — the rest of the
        // plan is then moot rather than wrong.
        if (state.phase === 'gameEnd') break;
        throw new Error(`runMatch: the strategy of player ${player} named moves after `
          + `${named[i - 1]!.move} ended its turn`);
      }
      play(move, args);
    }
    // Nothing to schedule and nothing to pace: a strategy that named only the
    // first move of its turn is simply asked again by the loop.
  }

  return { winnerIndex: state.winnerIndex!, board: state.board, history };
};
