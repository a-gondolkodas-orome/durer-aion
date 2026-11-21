import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

/// One move a strategy names: its arguments and its name. Arguments of
/// `undefined` ask for a random move from the game's `possibleMoves`.
export type BotMove<T_Move> = [T_Move | undefined, string];

/// What a strategy answers on its turn: one move, or several, played in order.
/// Naming a whole turn is the right shape when the turn is one decision made of
/// several moves; naming only its first move is equally fine, as the bot is
/// asked again while the turn is still its own. The contract is the one the
/// strategy practice site's engine keeps (its components/AGENTS.md § Bot
/// contract), in this package's tuple form.
///
/// The server holds a plan for as long as the turn takes, so a team reloading
/// meanwhile loses none of it. A plan is lost only when the backend stops
/// between two of its moves, or the dry run is reloaded in the bot's think
/// time, and then the strategy is asked halfway through its own turn. A move
/// the game refuses stalls the match rather than being replaced, and the
/// server logs it (socketio_botmoves.ts says why).
export type BotTurn<T_Move> = BotMove<T_Move> | BotMove<T_Move>[];

/// A strategy names the moves to make. `setupData` is the match's setup data,
/// which only the server has and hands on (see MatchBot); in the browser,
/// `Local` calls a bot without it.
export type BotStrategy<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData?: unknown) => BotTurn<T_Move>;

type BotAction = Awaited<ReturnType<Bot['play']>>['action'];

/// A single move's name is a string where a list holds its second move.
function asBotMoves<T_Move>(turn: BotTurn<T_Move>): BotMove<T_Move>[] {
  return typeof turn[1] === 'string' ? [turn as BotMove<T_Move>] : turn as BotMove<T_Move>[];
}

/// A bot that is also handed the match's setup data, which boardgame.io keeps
/// in the match's metadata, out of every client's reach: the relay's judge
/// reads its problems and answers from there.
export type MatchBot = Bot & {
  /// The next move, for a host that asks for one at a time and asks again
  /// while the turn is the bot's: boardgame.io's `Local`. Waits first.
  play(state: State, playerID: string, setupData?: unknown): ReturnType<Bot['play']>;
  /// Every move the strategy names from this position, in order, for a host
  /// that plays them out itself: the server. Does not wait.
  planTurn(state: State, playerID: string, setupData?: unknown): BotAction[];
  /// The pause before each move, so the team sees what came before it land.
  wait(): Promise<void>;
};

/// Wraps a strategy into a boardgame.io Bot class. The return type is spelled
/// out because a declaration file cannot name the class itself: it inherits
/// Bot's private members.
export function botWrapper<T_SpecificGameState, T_Move>(
  botstrategy: BotStrategy<T_SpecificGameState, T_Move>,
): new (...args: ConstructorParameters<typeof Bot>) => MatchBot {
  class _Bot extends Bot {
    /// What is left of the turn `play` last planned, and the state it goes on
    /// from. `Local` keeps one bot per match, so one plan is enough; the server
    /// shares a bot between matches and calls `planTurn` instead.
    private plan: { after: Pick<State, '_stateID'> & Pick<State['ctx'], 'turn' | 'phase'>; rest: BotAction[] } | null = null;

    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    /// Throws when a random move is asked for and the game allows none: there
    /// is no move to make, which is a bug in the strategy or in `possibleMoves`.
    planTurn(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): BotAction[] {
      const named = asBotMoves(botstrategy(state, playerID, setupData));
      // Nothing named is no opinion, like an `undefined` move.
      if (named.length === 0) return [this.randomMove(state, playerID)];
      return named.map(([move, moveName]) => move === undefined
        ? this.randomMove(state, playerID)
        : { type: 'MAKE_MOVE', payload: { type: moveName, args: move, playerID } });
    }

    async play(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): ReturnType<Bot['play']> {
      await this.wait();
      // A move boardgame.io accepts advances `_stateID` by one, so the plan
      // goes on only from the state its previous move made. Any other state —
      // a move rejected, the turn over, a reloaded match — is planned afresh.
      const plan = this.plan;
      this.plan = null;
      const goesOn = plan !== null && plan.rest.length > 0 && plan.after._stateID === state._stateID
        && plan.after.turn === state.ctx.turn && plan.after.phase === state.ctx.phase;
      const [action, ...rest] = goesOn ? plan.rest : this.planTurn(state, playerID, setupData);
      if (rest.length > 0) {
        this.plan = { after: { _stateID: state._stateID + 1, turn: state.ctx.turn, phase: state.ctx.phase }, rest };
      }
      return { action };
    }

    private randomMove(state: State<T_SpecificGameState>, playerID: string): BotAction {
      const possible_moves = this.enumerate(state.G, state.ctx, playerID);
      if (possible_moves.length === 0) {
        throw new Error(`The bot of player ${playerID} was to play a random move, and the game allows none.`);
      }
      return possible_moves[Math.floor(Math.random() * possible_moves.length)];
    }
  }
  return _Bot;
}
