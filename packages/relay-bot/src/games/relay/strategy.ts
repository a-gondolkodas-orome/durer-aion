import { State } from 'boardgame.io';
import { MyGameState, RELAY_MAX_TRIES, RelayMoveArgs } from 'game';
import { localizeProblem } from 'schemas';
import type { Language, Localizable, Problem as BankProblem, ProblemId, RelayConfig } from 'schemas';

export interface Problem {
  /// The same in every language, or one per language.
  problemText: Localizable<string>;
  answer: number;
  points: number;
  url?: Localizable<string>;
  help1?: string;
  help2?: string;
}

export function relayStrategy(problemList: Problem[]) {
  return (state: State<MyGameState>, _botID: string): [RelayMoveArgs, string] => {
    if (state.G.numberOfTry === 0) {
      const firstProblem = problemList[state.G.currentProblem];
      return [[firstProblem.problemText, problemList.map(p => p.points), firstProblem.url ?? ""], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if (state.G.answer === problemList[state.G.currentProblem].answer) {
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < RELAY_MAX_TRIES) {
      return [[state.G.currentProblemAvailablePoints - 1], "nextTry"];
    }

    if (state.G.currentProblem < problemList.length - 1) {
      const nextProblem = problemList[state.G.currentProblem + 1];
      return [[nextProblem.problemText, correctnessPreviousAnswer, nextProblem.url ?? ""], "newProblem"];
    }
    return [[correctnessPreviousAnswer], "endGame"];
  }
}

// A relay's problems as the judge serves them: each text and image in every
// language of the competition, so the board can show the team's own and
// switch with it mid-match.
export function judgeProblems(
  relay: RelayConfig,
  languages: readonly Language[],
  problems: ReadonlyMap<ProblemId, BankProblem>,
): Problem[] {
  return relay.problems.map(({ problemId, points }) => {
    const problem = problems.get(problemId);
    if (problem === undefined) {
      throw new Error(`The relay refers to the problem ${problemId}, which does not exist`);
    }
    const localized = languages.map(language => [language, localizeProblem(problem, language)] as const);
    const problemText = Object.fromEntries(localized.map(([language, content]) => [language, content.problemText]));
    const url = Object.fromEntries(localized.map(([language, content]) => [language, content.imageUrl ?? '']));
    return { problemText, answer: problem.answer, points, url };
  });
}
