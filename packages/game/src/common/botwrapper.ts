import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

/// A strategy names the move to make, or `undefined` for a random one.
/// `setupData` is the match's setup data, which only the server has and hands
/// on (see MatchBot); in the browser, `Local` calls a bot without it.
export type BotStrategy<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData?: unknown) => [T_Move | undefined, string];

/// A bot that is also handed the match's setup data, which boardgame.io keeps
/// in the match's metadata, out of every client's reach: the relay's judge
/// reads its problems and answers from there.
export type MatchBot = Bot & {
  play(state: State, playerID: string, setupData?: unknown): ReturnType<Bot['play']>;
};

/// Wraps a strategy into a boardgame.io Bot class. The return type is spelled
/// out because a declaration file cannot name the class itself: it inherits
/// Bot's private members.
export function botWrapper<T_SpecificGameState, T_Move>(
  botstrategy: BotStrategy<T_SpecificGameState, T_Move>,
): new (...args: ConstructorParameters<typeof Bot>) => MatchBot {
  class _Bot extends Bot {
    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    async play(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): ReturnType<Bot['play']> {
      await this.wait();
      const [move, moveName] = botstrategy(state, playerID, setupData);
      if (move === undefined) {
        const possible_moves = this.enumerate(state.G, state.ctx, playerID);
        const randomIndex = Math.floor(Math.random() * possible_moves.length);
        return { action: possible_moves[randomIndex] };
      }
      return {
        action: {
          type: 'MAKE_MOVE',
          payload: {
            type: moveName,
            args: move,
            playerID
          },
        },
      };
    }
  }
  return _Bot;
}
