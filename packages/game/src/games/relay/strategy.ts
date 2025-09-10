import { State } from 'boardgame.io';
import { MyGameState } from './game';

export interface RelayProblem {
  category: string;
  index: number;
  problemText: string;
  answer: number;
  points: number;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
}

export async function strategy(getProblems: () => Promise<RelayProblem[]>){
  const problems = await getProblems();

  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    const problemIdx = state.G.currentProblem;
    if (state.G.numberOfTry === 0) {
      let url = problems[problemIdx].attachmentUrl ?? "";
      return [[problems[problemIdx].problemText,3,url], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[problemIdx].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }

    // Next problem if there is one and the time is not over
    if (problemIdx < 8) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
      let url = problems[problemIdx + 1].attachmentUrl ?? "";
      let nextProblem = problems[problemIdx + 1];
      return [[nextProblem.problemText, nextProblem.points, correctnessPreviousAnswer, url], "newProblem"];
    }
    // End of the game
    return [[correctnessPreviousAnswer], "endGame"];
  }
}
