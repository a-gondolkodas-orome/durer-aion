import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(state: State<MyGameState>, botID: string): [any[] | undefined, string] {
  let correctnessPreviousAnswer = false;
  if(state.G.answer === (state.G.currentProblem+1)*2){
    correctnessPreviousAnswer = true;
  } else if(state.G.numberOfTry < 3){
    // One more try
    return [[state.G.currentProblemMaxPoints-1, state.G.answer], "nextTry"];
  }

  // Next problem if there is one and the time is not over
  if (state.G.currentProblem < 8) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
    let tmp = (state.G.currentProblem+2).toString();
    return [[tmp+"+"+tmp+"?",3,correctnessPreviousAnswer, state.G.answer], "newProblem"];
  }
  // End of the game
  return [[], "endGame"];
}