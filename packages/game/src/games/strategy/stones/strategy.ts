import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../../common';
import { moveMap } from './moveMap';

function startingPosition({ G, ctx}: any, category: "E"): MyGameState {
  const initialPositions = [
    [[9, 10], [9, 9]],
    [[9, 8], [9, 7]],
    [[5, 8], [8, 7]],
    [[5, 7], [6, 7]],
    [[6, 4], [7, 4]],
    [[4, 4], [4, 3]],
  ]

  let left, right;
  if (G.difficulty === "live") {
      let NoL = Math.min(G.numberOfLoss, initialPositions.length - 1);
      let WS = G.winningStreak;
      left = initialPositions[NoL][WS][0];
      right = initialPositions[NoL][WS][1];
  } else {
    left = Math.floor(Math.random() * 9) + 2;
    right = Math.floor(Math.random() * 9) + 2;
  }
  return {
    stonesLeft: left,
    stonesRight: right,
    lastMoveFromLeftByPlayer: { '0': false, '1': false },
  };
}

function winningStrategy(category: "C" | "D" | "E", state: State<MyGameState & GameStateMixin>, botID: string): [boolean | undefined, string] {
    const G = state.G;
    const ctx = state.ctx;
    const player = ctx.currentPlayer === G.firstPlayer ? '0' : '1';
    const key = `${G.stonesLeft}-${G.stonesRight}.${G.lastMoveFromLeftByPlayer}.${player}`;

    const move = moveMap[key]; // may be undefined if key not found
    return [move, "takeStone"];
}

export function strategyWrapper(category: "E") {
  return (state: State<MyGameState & GameStateMixin>, botID: string): [MyGameState | boolean | undefined, string] => {
    if (state.ctx.phase === "startNewGame") {
      return [startingPosition({ G: state.G, ctx: state.ctx }, category), "setStartingPosition"];
    }

    if (state.G.difficulty === "test") {
      return [undefined, "takeStone"]; // random move
    } else {
      return winningStrategy(category, state, botID);
    }
  };
}
