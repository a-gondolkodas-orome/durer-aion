import { State } from 'boardgame.io';
import { MyGameState } from './game';
import { RelayProblemsRepository } from '../../server/db';

export async function strategy(category: "C" | "D" | "E", problemsRepo: RelayProblemsRepository){
  const problems = await problemsRepo.getProblems(category);

  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    if (state.G.numberOfTry === 0) {
      let url = problems[state.G.currentProblem].attachmentUrl ?? "";
      return [[problems[state.G.currentProblem].problemText,3,url], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[state.G.currentProblem].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }

    // Next problem if there is one and the time is not over
    if (state.G.currentProblem < 8) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
      let url = problems[state.G.currentProblem+1].attachmentUrl ?? "";
      let nextProblem = problems[state.G.currentProblem+1];
      return [[nextProblem.problemText, nextProblem.points, correctnessPreviousAnswer, url], "newProblem"];
    }
    // End of the game
    return [[correctnessPreviousAnswer], "endGame"];
  }
}