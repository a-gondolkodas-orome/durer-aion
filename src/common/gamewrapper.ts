import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType, GUESSER_PLAYER, JUDGE_PLAYER } from './types';

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string):void { // TODO: type
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType({ G, ctx, playerID, random, events }: any, difficulty: string) {
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  };
  let newG = {
    ...G,
    difficulty: difficulty,
    firstPlayer: null,
    winner: null,
    numberOfTries: G.numberOfTries + (difficulty === "live" ? 1 : 0),
  }
  events.endTurn();
  return {
    ...newG,
  }
};

function setStartingPosition({ G, ctx, playerID, random, events }: any, startingPosition: any) { // TODO: type
  if (playerID !== JUDGE_PLAYER) {
    return INVALID_MOVE;
  };
  events.endTurn();
  return {
    ...G,
    ...startingPosition,
  };
};

const lengthOfCompetition = 30 * 60; // seconds

// This is *very important*, so as not to spam
export function isMakeMovePayloadReadOnly(payload_type: string) {
  return payload_type === "getTime";
}


function getTime({ G, ctx, playerID, events }: any) {
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  }
  G.millisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
}

export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState>): Game<T_SpecificGameState & GameStateMixin> {
  const myGameWrapper: Game<T_SpecificGameState & GameStateMixin> = {
    setup: () => ({
      ...game.setup(),
      millisecondsRemaining: 1000 * lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
      firstPlayer: null,
      difficulty: null,
      winner: null,
      numberOfTries: 0,
      numberOfLoss: 0,
      winningStreak: 0,
      points: 0,
    }),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: { chooseNewGameType, setStartingPosition, getTime },
        endIf: ({ G }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole, getTime },
        endIf: ({ G }) => { return G.firstPlayer !== null },
        next: "play",
        turn: {
          order: TurnOrder.RESET,
        },
      },
      play: {
        moves: { ...game.moves, getTime },
        endIf: ({ G }) => { return G.winner !== null },
        next: "startNewGame",
        turn: {
          order: {
            first: ({ G }) => {
              return G.firstPlayer === GUESSER_PLAYER ? 0 : 1;
            },
            next: ({ ctx }) => {
              return (ctx.playOrderPos + 1) % ctx.numPlayers
            },
          },
          ...(!("turn" in game) && {
            minMoves: 1,
            maxMoves: 1
          }),
          ...game.turn,
          onEnd: ({G, ctx, playerID, events, random, log}) => {
            if (game.turn?.onEnd !== undefined) {
              game.turn.onEnd({G, ctx, playerID, events, log, random});
            }
          },
        },
      },
    },
    // conflict with boardgameio type, where id is string, instead of playerIDType
    ai: { enumerate: game.possibleMoves as (G:T_SpecificGameState,ctx:Ctx,playerID:string)=>any[] }
  };

  return myGameWrapper;
};
