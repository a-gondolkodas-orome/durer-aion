import type { BotStrategy, Gameplay } from './types';
import { buildCtx } from './build-ctx';
import { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './bot-turn';
import { reduceMove } from './reducer';
import type { CoreState } from './store';

export type MatchMove<TBoard> = {
  player: number
  move: string
  args: unknown[]
  // the board the move produced, so a test can judge a position without
  // re-implementing the move it came from
  board: TBoard
}

// Names only ever reach presentation code; a headless host has no players to
// name, so any placeholder does.
export const HEADLESS_PLAYER_NAMES: [string, string] = ['0', '1'];

// Plays one whole bot turn — asking the strategy again while the turn is still
// its own, and running the auto endOfTurnMove straight away, since there is
// nothing to animate. The headless host of the bot contract, next to the React
// shell: runMatch drives every one of its turns through this.
//
// Everything that goes wrong throws: the strategy is the caller's own code,
// so a bad name, an illegal move or a turn that never closes is a bug to
// surface, not input to tolerate.
//
// `state.chosenRoleIndex` is read by strategies to learn their seat and is
// taken as given here: the host owns it (the shell sets it at role selection,
// runMatch flips it per turn).
export const playBotTurn = <TBoard, TTurnState = unknown>(
  initialState: CoreState<TBoard, TTurnState>,
  gameplay: Gameplay<TBoard, TTurnState>,
  strategy: BotStrategy<TBoard>,
  { maxMoves = 100 }: { maxMoves?: number } = {}
): { state: CoreState<TBoard, TTurnState>; moves: MatchMove<TBoard>[] } => {
  const { moves: moveDefinitions, endOfTurnMove } = gameplay;
  if (initialState.phase !== 'play') {
    throw new Error('playBotTurn: the game is not in play');
  }
  let state = initialState;
  const played: MatchMove<TBoard>[] = [];
  const player = state.currentPlayer!;

  const play = (name: string, args: unknown[]) => {
    if (!moveDefinitions[name]) throw new Error(unknownMoveMessage(name, moveDefinitions));
    const transition = reduceMove(state, moveDefinitions[name]!, name, args, HEADLESS_PLAYER_NAMES);
    if (transition.illegal) {
      throw new Error(`playBotTurn: illegal move ${name}(${JSON.stringify(args)}) `
        + `rejected on board ${JSON.stringify(state.board)}`);
    }
    played.push({
      player: state.currentPlayer!, move: name, args, board: transition.result.nextBoard
    });
    state = transition.state;
    if (endOfTurnMove && transition.autoEndOfTurn) {
      play(endOfTurnMove, []);
    }
  };

  while (isBotTurnUnfinished(state, player)) {
    // The ask-again contract bounds nothing by itself: a strategy that keeps
    // naming turn-preserving moves would loop forever, and a server must not.
    if (played.length >= maxMoves) {
      throw new Error(`playBotTurn: turn still open after ${maxMoves} moves`);
    }
    const named = asBotMoves(
      strategy({ board: state.board, ctx: buildCtx(state, HEADLESS_PLAYER_NAMES) })
    );
    if (!named.length) {
      throw new Error(`playBotTurn: the strategy of player ${player} named no move`);
    }
    for (const [i, { move, args = [] }] of named.entries()) {
      if (i > 0 && !isBotTurnUnfinished(state, player)) {
        // A turn planned as a whole may win partway through — the rest of the
        // plan is then moot rather than wrong.
        if (state.phase === 'gameEnd') break;
        throw new Error(`playBotTurn: the strategy of player ${player} named moves after `
          + `${named[i - 1]!.move} ended its turn`);
      }
      play(move, args);
    }
    // Nothing to schedule and nothing to pace: a strategy that named only the
    // first move of its turn is simply asked again by the loop.
  }

  return { state, moves: played };
};
