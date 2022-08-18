import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';
import { BotAction } from 'boardgame.io/dist/types/src/ai/bot';

// Determine the next move for the bot and which move function to use.
type BotStrategy<T_SpecificGameState, T_Move> = (state: State<T_SpecificGameState>, botID: string) => [T_Move | undefined, string];

/// wraps a convenient strategy to a full Boardgame.io Bot class
/// @param strategy Must calculate the move to be made or `undefined` if a random move is to be made
/// @result a Boardgame.io Bot class
export default function botWrapper<T_SpecificGameState, T_Move>(botstrategy: BotStrategy<T_SpecificGameState, T_Move>) {
  class _Bot extends Bot {
    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    async play(state: State<T_SpecificGameState>, playerID: string): Promise<{ action: BotAction; metadata?: any; }> {
      await this.wait();
      const [move, moveName] = botstrategy(state, playerID);
      if (move === undefined) {
        let possible_moves = this.enumerate(state.G, state.ctx, playerID);
        let randomIndex = Math.floor(Math.random() * possible_moves.length);
        return { action: possible_moves[randomIndex] };
      }
      return {
        action: {
          type: 'MAKE_MOVE',
          payload: {
            type: moveName,
            args: [
              move
            ],
            playerID
          },
        },
      };
    }
  }
  return _Bot;
}
// TODO: accept more than one move