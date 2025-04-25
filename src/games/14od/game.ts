import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType, guesserPlayer, judgePlayer, PlayerIDType } from '../../common/types';

export type Position = (0|1|null)[][];

export interface MyGameState {
  playerLetters: string[];
  enemyLetters: string[];
  remainingLetters: string[];
}

export const MyGame: GameType<MyGameState> = {
  // TOOO: solve type
  name: "14od",
  setup: () => ({
    playerLetters: [],
    enemyLetters: [],
    remainingLetters: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
    ],
  }),

  moves: {
    clickCell: ({ G, ctx, playerID, events }, s: string) => {
      if (!G.remainingLetters.includes(s)) {
        // TODO: more checks
        return INVALID_MOVE;
      }
      if (playerID === "0") {
        G.playerLetters.push(s);
      } else {
        G.enemyLetters.push(s);
      }
      G.remainingLetters = G.remainingLetters.filter((x) => x !== s);
      let winner = getWinner(
        G.playerLetters,
        G.enemyLetters,
        G.remainingLetters,
        G.firstPlayer
      );
      if (winner === guesserPlayer || winner === judgePlayer) {
        G.winner = winner;
        if(winner === "0"){
          G.winningStreak = G.winningStreak + 1;
          if(G.winningStreak >= 2){
            G.points = 12-G.numberOfLoss*2; // TODO
            events.endGame();
          }
        } else {
          G.winningStreak = 0;
          G.numberOfLoss += 1;
        }
      }
    },
  },

  possibleMoves: (G, ctx, playerID) => {
    let moves = [];
    for (let i of G.remainingLetters) {
      moves.push({ move: "clickCell", args: [i] });
    }
    return moves;
  },
};

function getWinner(
  first: string[],
  second: string[],
  remaining: string[],
  firstPlayer: PlayerIDType | null
): string {
  if(remaining.length === 0){
    if(firstPlayer === PlayerIDType.guesserPlayer){
      return judgePlayer;
    } // Enemy wins
    return guesserPlayer; //Player wins
  }

  const SOROK = [
    "ABC",
    "DEF",
    "GHI",
    "AJV",
    "DKS",
    "GLP",
    "PQR",
    "STU",
    "VWX",
    "IMR",
    "FNU",
    "COX",
    "ADG",
    "CFI",
    "PSV",
    "RUX",
  ];

  for(let i of SOROK){
    if(first.includes(i[0]) && first.includes(i[1]) && first.includes(i[2])){
      return "0"; // Player wins
    }

    if (
      second.includes(i[0]) &&
      second.includes(i[1]) &&
      second.includes(i[2])
    ) {
      return "1"; // Enemy wins
    }
  }

  return ""; // No winner yet
}