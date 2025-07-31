import { parse, TomlTable } from 'smol-toml';
import { RelayProblemModel } from './entities/relayProblemModel';

const CATEGORIES: string[] = ["C", "D", "E"] as const;

function validateProblem(problem: any, index: number, category: string, imgNames: string[]): asserts problem is RelayProblemModel {
  const errPrefix = `Problem at index ${index} in category ${category} `;
  if (typeof problem !== 'object' || problem === null) {
    throw new Error(errPrefix + `is not an object.`);
  }
  const problemKeys = Object.keys(problem);
  if (!problemKeys.includes('problemText') || typeof problem.problemText !== 'string') {
    throw new Error(errPrefix + `is missing 'problemText' or it is not a string.`);
  }
  if (!problemKeys.includes('answer') || (typeof problem['answer'] !== 'string' && typeof problem['answer'] !== 'number')) {
    throw new Error(errPrefix + `is missing 'answer' or it is not a string or number.`);
  }
  if (!problemKeys.includes('points') || typeof problem['points'] !== 'number') {
    throw new Error(errPrefix + `is missing 'points' or it is not a number.`);
  }
  if (problemKeys.includes('attachment') && typeof problem['attachment'] !== 'string') {
    throw new Error(errPrefix + `field 'attachment' is not a string.`);
  }
  if (problemKeys.includes('attachment') && !imgNames.includes(problem['attachment'])) {
    throw new Error(errPrefix + `has a missing 'attachment': ${problem['attachment']}. Expected one of: ${imgNames.join(', ')}.`);
  }
  problemKeys.forEach(key => {
    if (!['problemText', 'answer', 'points', 'attachment', 'category', 'index'].includes(key)) {
      throw new Error(errPrefix + `has an unexpected key: ${key}. Expected keys are: problemText, answer, points, attachment.`);
    }
  });
}

function TOMLToProblemList(parsedData: TomlTable, imgNames: string[]): RelayProblemModel[] {
  const categories = Object.keys(parsedData);
  if (categories.length === 0) {
    throw new Error("Empty TOML.");
  }
  let parsedProblems: RelayProblemModel[] = [];

  categories.forEach(category => {
    if (!CATEGORIES.includes(category)) {
      throw new Error(`Invalid category: ${category}. Expected one of ${CATEGORIES.join(', ')}.`);
    }

    const problems = parsedData[category];
    if (!Array.isArray(problems)) {
      throw new Error(`Category ${category} should contain an array of problems (e.g. [[C]]).`);
    }

    problems.forEach((problem, index) => {
      problem = {
        ...problem as object,
        category: category,
        index: index,
      }
      validateProblem(problem, index, category, imgNames); // asserts problem is RelayProblemModel
      parsedProblems.push(problem);
    });
  });
  return parsedProblems;
}

export function parseProblemTOML(tomlString: string, imgNames: string[]): RelayProblemModel[] {
  const parsedData = parse(tomlString);
  return TOMLToProblemList(parsedData, imgNames);
}
