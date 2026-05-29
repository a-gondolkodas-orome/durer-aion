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
      const url = problems[problemIdx].attachmentUrl ?? "";
      return [[problems[problemIdx].problemText,3,url], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[problemIdx].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }

    if (problemIdx + 1 < problems.length) {
      const url = problems[problemIdx + 1].attachmentUrl ?? "";
      const nextProblem = problems[problemIdx + 1];
      return [[nextProblem.problemText, nextProblem.points, correctnessPreviousAnswer, url], "newProblem"];
    }

    return [[correctnessPreviousAnswer], "endGame"];
  }
}
