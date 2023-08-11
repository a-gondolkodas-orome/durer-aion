import { Game, State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';
import { BotAction } from 'boardgame.io/dist/types/src/ai/bot';
import { PlayerIDType } from './types';

// Determine the next move for the bot and which move function to use.
type BotStrategy<T_SpecificGameState, T_Move> = (state: State<T_SpecificGameState>, botID: string) => [T_Move | undefined, string];


export type SpecificBot<T_SpecificGameState, T_Move> = ReturnType<typeof botWrapper<T_SpecificGameState, T_Move>>

/// wraps a convenient strategy to a full Boardgame.io Bot class
/// @param strategy Must calculate the move to be made or `undefined` if a random move is to be made
/// @result a Boardgame.io Bot class
export default function botWrapper<T_SpecificGameState, T_Move>(botstrategy: BotStrategy<T_SpecificGameState, T_Move>)
  {
    //this actually results in a somewhat correct type, altough it doesn't implements some of the private methods, for some reason ts doesn't complains about that
  class _Bot extends Bot {
    // waits 400 ms for UX, and is a private type
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    async play(state: State<T_SpecificGameState>, playerID: PlayerIDType): Promise<{ action: BotAction; metadata?: any; }> {
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

export type MergedWrappedBots<T> = T extends (SpecificBot<infer U,infer M1>|SpecificBot<infer V,infer M2>)[] ? SpecificBot<U|V,M1|M2>[] : never;

//Most unholiest possible trick in the name of ''''''type safety'''''
export type ChangeReturnType<T> = T extends (...args: infer Args) => any ? (...args: Args) => BotAction[] : never;

export function makeWrappedBot<T_SpecificGameState, T_Move>(
  wrappedFactory:SpecificBot<T_SpecificGameState, T_Move>,
  enumerate: NonNullable<Game['ai']>['enumerate'], //<- this is in fact inconsistent with itself for matter of fact this is not equal to Bot['enumerate]
  seed?: Game['seed']):
  InstanceType<SpecificBot<T_SpecificGameState, T_Move>>{
  return new (wrappedFactory)({
    enumerate: enumerate,
    seed: seed,
  })
}