import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

type BotStrategy<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData: unknown) => [T_Move | undefined, string];

/// A bot that is also handed the match's setup data, which boardgame.io keeps
/// in the match's metadata, out of every client's reach: the relay's judge
/// reads its problems and answers from there.
export type MatchBot = Bot & {
  play(state: State, playerID: string, setupData?: unknown): ReturnType<Bot['play']>;
};

/// wraps a convenient strategy to a full Boardgame.io Bot class
/// @param strategy Must calculate the move to be made or `undefined` if a random move is to be made
/// @result a Boardgame.io Bot class
export default function botWrapper<T_SpecificGameState, T_Move>(botstrategy: BotStrategy<T_SpecificGameState, T_Move>) {
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
// TODO: accept more than one move
