import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

/// One move a strategy names: its arguments and its name. A strategy that
/// plays at random picks the move itself.
export type BotMove<T_Move> = [T_Move, string];

/// What a strategy answers on its turn: one move, or several, played in order.
/// Naming a whole turn is the right shape when the turn is one decision made of
/// several moves (`20ocde/`'s two X's); naming only its next move is equally
/// fine, as the bot is asked again while the turn is still its own. So a
/// strategy may be asked halfway through its own turn, and answers from the
/// state as it is: docs/ARCHITECTURE.md says when a plan is lost. The contract
/// is the strategy practice site's engine's (its components/AGENTS.md § Bot
/// contract), in this package's tuple form.
export type BotTurn<T_Move> = BotMove<T_Move> | BotMove<T_Move>[];

/// A strategy names the moves to make. `setupData` is the match's setup data,
/// which only the server has and hands on; in the browser, `Local` calls a bot
/// without it.
export type BotStrategy<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData?: unknown) => BotTurn<T_Move>;

type BotAction = Awaited<ReturnType<Bot['play']>>['action'];

/// A bot for one match, which boardgame.io asks for one move at a time while
/// the turn is its own, and which is also handed the match's setup data: the
/// relay's judge reads its problems and answers from there.
export type MatchBot = Bot & {
  /// The next move of the bot's plan for its turn, after its pause. The plan
  /// goes on only from the state its previous move made; any other state — a
  /// move refused, a later turn, a reloaded match — is planned afresh.
  play(state: State, playerID: string, setupData?: unknown): ReturnType<Bot['play']>;
  /// The pause before each move, so the team sees what came before it land.
  wait(): Promise<void>;
  /// How many moves of its plan are still unplayed: once its turn is over,
  /// moves the strategy named past its end.
  movesLeft(): number;
};

/// Wraps a strategy into a boardgame.io Bot class. A bot keeps its plan between
/// moves, so each instance serves one match: `Local` keeps one per match, and
/// the server makes one per bot turn. The return type is spelled out because a
/// declaration file cannot name the class itself: it inherits Bot's private
/// members.
export function botWrapper<T_SpecificGameState, T_Move>(
  botstrategy: BotStrategy<T_SpecificGameState, T_Move>,
): new (...args: ConstructorParameters<typeof Bot>) => MatchBot {
  class _Bot extends Bot {
    private plan: { after: Pick<State, '_stateID'> & Pick<State['ctx'], 'turn' | 'phase'>; rest: BotAction[] } | null = null;

    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    movesLeft(): number {
      return this.plan?.rest.length ?? 0;
    }

    async play(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): ReturnType<Bot['play']> {
      await this.wait();
      // A move boardgame.io accepts advances `_stateID` by one.
      const plan = this.plan;
      this.plan = null;
      const goesOn = plan !== null && plan.after._stateID === state._stateID
        && plan.after.turn === state.ctx.turn && plan.after.phase === state.ctx.phase;
      const [action, ...rest] = goesOn ? plan.rest : this.planTurn(state, playerID, setupData);
      if (rest.length > 0) {
        this.plan = { after: { _stateID: state._stateID + 1, turn: state.ctx.turn, phase: state.ctx.phase }, rest };
      }
      return { action };
    }

    private planTurn(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): BotAction[] {
      const turn = botstrategy(state, playerID, setupData);
      // A single move's name is a string where a list holds its second move.
      const moves = typeof turn[1] === 'string' ? [turn as BotMove<T_Move>] : turn as BotMove<T_Move>[];
      if (moves.length === 0) {
        throw new Error(`The bot of player ${playerID} named no move.`);
      }
      return moves.map(([move, moveName]) => ({ type: 'MAKE_MOVE', payload: { type: moveName, args: move, playerID } }));
    }
  }
  return _Bot;
}
