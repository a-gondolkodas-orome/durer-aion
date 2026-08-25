import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

// boardgame.io does not export the name for what a bot may answer with. Taking
// it off the Bot class it does export keeps this out of the package's build
// layout, which is not an API and can be rearranged by a patch release.
type BotAction = ReturnType<Bot['enumerate']>[number];

// Determine the next move for the bot and which move function to use.
type BotStrategy<T_SpecificGameState, T_Move> = (state: State<T_SpecificGameState>, botID: string) => [T_Move | undefined, string];

interface BotOpts<T_SpecificGameState> {
  enumerate: (
    G: T_SpecificGameState,
    ctx: State<T_SpecificGameState>["ctx"],
    playerID: string,
  ) => BotAction[];
  seed?: string | number;
}

/// wraps a convenient strategy to a full Boardgame.io Bot class
/// @param strategy Must calculate the move to be made or `undefined` if a random move is to be made
/// @result a Boardgame.io Bot class
export function botWrapper<T_SpecificGameState, T_Move>(botstrategy: BotStrategy<T_SpecificGameState, T_Move>): new (opts: BotOpts<T_SpecificGameState>) => Bot {
  return class extends Bot {

    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    async play(state: State<T_SpecificGameState>, playerID: string): Promise<{ action: BotAction }> {
      await this.wait();
      const [move, moveName] = botstrategy(state, playerID);
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
}
// TODO: accept more than one move