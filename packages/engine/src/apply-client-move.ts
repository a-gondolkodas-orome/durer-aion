import type { Gameplay } from './types';
import { reduceMove } from './reducer';
import type { CoreState } from './store';
import { HEADLESS_PLAYER_NAMES, type MatchMove } from './play-bot-turn';

export type ClientMoveRejection = 'notInPlay' | 'notYourTurn' | 'unknownMove' | 'illegalMove'

export type ClientMoveResult<TBoard, TTurnState = unknown> =
  | {
    ok: true
    state: CoreState<TBoard, TTurnState>
    // The client's move plus any auto endOfTurnMove it triggered, in play
    // order — what a server appends to its match log.
    playedMoves: MatchMove<TBoard>[]
    gameJustEnded?: { winnerIndex: number }
  }
  // The state is deliberately absent from a rejection: nothing changed, and
  // handing back a state invites applying it.
  | { ok: false; rejection: ClientMoveRejection }

// Applies one client-submitted move: validate, reduce, then run the auto
// endOfTurnMove to completion — a server has nothing to animate, so there is
// no delay to schedule.
//
// Rejects rather than throws, because the move arrives over the wire: a
// request naming a wrong move, an illegal one, or a turn the client does not
// hold is input to refuse with a reason the route can map to a response — not
// a bug in the caller. The auto endOfTurnMove is the opposite case: that move
// is the game's own, so its failure throws, exactly as a bot's would.
//
// `asPlayer` is the seat the server believes the client holds; passing it
// turns "whose turn is it" into a rejection here rather than a check every
// route has to remember. Turn ownership is all it means — it is the same
// check the browser shell folds into isClientMoveAllowed.
export const applyClientMove = <TBoard, TTurnState = unknown>(
  state: CoreState<TBoard, TTurnState>,
  gameplay: Gameplay<TBoard, TTurnState>,
  name: string,
  args: unknown[],
  { asPlayer }: { asPlayer?: number } = {}
): ClientMoveResult<TBoard, TTurnState> => {
  const { moves, endOfTurnMove } = gameplay;
  if (state.phase !== 'play') return { ok: false, rejection: 'notInPlay' };
  if (asPlayer !== undefined && state.currentPlayer !== asPlayer) {
    return { ok: false, rejection: 'notYourTurn' };
  }
  if (!moves[name]) return { ok: false, rejection: 'unknownMove' };

  const transition = reduceMove(state, moves[name]!, name, args, HEADLESS_PLAYER_NAMES);
  if (transition.illegal) return { ok: false, rejection: 'illegalMove' };

  let next = transition.state;
  const playedMoves: MatchMove<TBoard>[] = [
    { player: state.currentPlayer!, move: name, args, board: transition.result.nextBoard }
  ];
  let gameJustEnded = transition.gameJustEnded;
  let autoEndOfTurn = transition.autoEndOfTurn;
  while (autoEndOfTurn && endOfTurnMove) {
    const definition = moves[endOfTurnMove];
    if (!definition) {
      throw new Error(`applyClientMove: gameplay.endOfTurnMove names unknown move '${endOfTurnMove}'`);
    }
    const auto = reduceMove(next, definition, endOfTurnMove, [], HEADLESS_PLAYER_NAMES);
    if (auto.illegal) {
      throw new Error(`applyClientMove: auto endOfTurnMove ${endOfTurnMove} `
        + `rejected on board ${JSON.stringify(next.board)}`);
    }
    playedMoves.push({
      player: next.currentPlayer!, move: endOfTurnMove, args: [], board: auto.result.nextBoard
    });
    gameJustEnded = auto.gameJustEnded ?? gameJustEnded;
    autoEndOfTurn = auto.autoEndOfTurn;
    next = auto.state;
  }

  return { ok: true, state: next, playedMoves, gameJustEnded };
};
