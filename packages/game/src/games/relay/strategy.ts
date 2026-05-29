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

export function strategy(getProblems: () => Promise<RelayProblem[]>){
  let problems: RelayProblem[] | null = null;
  getProblems().then(p => { problems = p; });

  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    if (!problems) return [undefined, "getTime"];
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
