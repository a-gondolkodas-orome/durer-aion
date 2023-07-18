import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { problems } from './problems';

export type Problem = {
  problemText: string;
  answer: number;
  points: number;
  url?: string;
  help1?: string;
  help2?: string;
}


export function strategy(category: any){
  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    if (state.G.numberOfTry === 0) {
      let url = problems[category][state.G.currentProblem].url;
      if(url === undefined){
        url = "";
      }
      return [[problems[category][state.G.currentProblem].problemText,3,url], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[category][state.G.currentProblem].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }
    
    // Next problem if there is one and the time is not over
    if (state.G.currentProblem < problems[category].length-1) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
      let url = problems[category][state.G.currentProblem+1].url;
      if(url === undefined){
        url = "";
      }
     return [[problems[category][state.G.currentProblem+1].problemText,problems[category][state.G.currentProblem+1].points,correctnessPreviousAnswer, url], "newProblem"];
    }
    // End of the game
    return [[correctnessPreviousAnswer], "endGame"];
  }
}