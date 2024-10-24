import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { GameStateMixin } from '../../common/types';






export function strategyWrapper(category: "C" | "D" | "E") {
  return (state: State<MyGameState & GameStateMixin>, botID: string): [number | { pile: number } | undefined, string] => {
    console.log("strategy", state.ctx.phase);
    if (state.ctx.phase === "startNewGame") {
      return [startingPosition({ G: state.G, ctx: state.ctx }, category), "setStartingPosition"];
    }

    if (state.G.difficulty === "test") {
      if (state.G.pile % 2 === 1) {
        return [0, "changePile"];
      }

      else if (Math.floor(Math.random() * 4) === 0) {
        return [0, "changePile"];
      }
      else return [1, "changePile"];
    }
    else {
      if (state.G.pile % 2 === 1) return [0, "changePile"];
      else if ((state.G.pile / 2 % 2 === 0 && state.G.pile !== 4) || state.G.pile === 6) return [0, "changePile"];
      else return [1, "changePile"];
    }
  }
}

function startingPosition({ G, ctx }: any, category: "C" | "D" | "E"): { pile: number } {
  if (category === "C") {
    // C Category
    return { pile: 17 };
  }
  if (category === "D") {
    // D Category
    if (G.difficulty === "test") {
      return { pile: Math.floor(Math.random() * 6) + 20 };
    }

    if (G.numberOfLoss === 0) {
      if (G.winningStreak  === 0) {
        return { pile: 24 };
      } else if (G.winningStreak === 1) {
        return { pile: 21 };
      }
    } else if (G.numberOfLoss === 1) {
      if (G.winningStreak === 0) {
        return { pile: 25 };
      } else if (G.winningStreak === 1) {
        return { pile: 22 };
      }
    } else if (G.numberOfLoss === 2) {
      if (G.winningStreak === 0) {
        return { pile: 20 };
      } else if (G.winningStreak === 1) {
        return { pile: 23 };
      }
    }
    else {
      if (G.numberOfTries % 2 === 1) {
        return { pile: Math.floor(Math.random() * 3) * 2 + 20 };
      } else if (G.numberOfTries % 2 === 0) {
        return { pile: Math.floor(Math.random() * 3) * 2 + 21 };
      }
    }





  }

  if (category === "E") {
    // E Category
    if (G.difficulty === "test") {
      return { pile: Math.floor(Math.random() * 21) + 30 };
    }

    if (G.numberOfLoss === 0) {
      if (G.winningStreak === 0) {
        return { pile: 36 };
      } else if (G.winningStreak === 1) {
        return { pile: 45 };
      }
    } else if (G.numberOfLoss === 1) {
      if (G.winningStreak  === 0) {
        return { pile: 31 };
      } else if (G.winningStreak === 1) {
        return { pile: 42 };
      }
    } else if (G.numberOfLoss === 2) {
      if (G.winningStreak === 0) {
        return { pile: 28 };
      } else if (G.winningStreak === 1) {
        return { pile: 49 };
      }
    }
    else {
      if (G.numberOfTries % 2 === 1) {
        return { pile: Math.floor(Math.random() * 11) * 2 + 30 };
      } else if (G.numberOfTries % 2 === 0) {
        return { pile: Math.floor(Math.random() * 10) * 2 + 31 };
      }
    }




  }
  //just in case
  return { pile: 17 };

}
