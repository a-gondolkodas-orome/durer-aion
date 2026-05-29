import { parse, TomlTable } from 'smol-toml';
import type { RelayProblem } from './strategy';

export function getS3Url(fileName: string, S3BucketName: string): string {
  return `https://${S3BucketName}.s3.amazonaws.com/${fileName}`;
}

interface RawProblem {
  category: string;
  index: number;
  problemText: string;
  answer: number;
  points: number;
  attachment?: string;
}

function formatProblemsWithAttachments(problems: RawProblem[], S3BucketName: string): RelayProblem[] {
  return problems.map(problem => ({
    category: problem.category,
    index: problem.index,
    problemText: problem.problemText,
    answer: problem.answer,
    points: problem.points,
    attachmentFileName: problem.attachment,
    attachmentUrl: problem.attachment ? getS3Url(`images/${problem.attachment}`, S3BucketName) : null
  }) as RelayProblem);
}

function tomlToRawProblem(problem: TomlTable, index: number, category: string, imgNames: string[]): RawProblem {
  const errPrefix = `Problem at index ${index} in category ${category} `;

  const problemKeys = Object.keys(problem);
  if (!problemKeys.includes('problemText') || typeof problem.problemText !== 'string') {
    throw new Error(errPrefix + `is missing 'problemText' or it is not a string.`);
  }
  if (!problemKeys.includes('answer') || typeof problem['answer'] !== 'number') {
    throw new Error(errPrefix + `is missing 'answer' or it is not a number.`);
  }
  if (!problemKeys.includes('points') || typeof problem['points'] !== 'number') {
    throw new Error(errPrefix + `is missing 'points' or it is not a number.`);
  }
  if (problemKeys.includes('attachment') && typeof problem['attachment'] !== 'string') {
    throw new Error(errPrefix + `field 'attachment' is not a string.`);
  }
  if (problemKeys.includes('attachment') && (typeof problem['attachment'] !== 'string' || !imgNames.includes(problem['attachment']))) {
    throw new Error(errPrefix + `has a missing 'attachment': ${problem['attachment']}. Expected one of: ${imgNames.join(', ')}.`);
  }
  problemKeys.forEach(key => {
    if (!['problemText', 'answer', 'points', 'attachment', 'category', 'index'].includes(key)) {
      throw new Error(errPrefix + `has an unexpected key: ${key}. Expected keys are: problemText, answer, points, attachment.`);
    }
  });
  return {
    category,
    index,
    problemText: problem.problemText as string,
    answer: problem.answer as number,
    points: problem.points as number,
    attachment: typeof problem['attachment'] === 'string' ? problem['attachment'] : undefined,
  } as RawProblem;
}

export function parseProblemTOML(tomlString: string, imgNames: string[], S3BucketName: string): RelayProblem[] {
  const parsedData = parse(tomlString);
  const categories = Object.keys(parsedData);
  if (categories.length === 0) {
    throw new Error("Empty TOML.");
  }
  const parsedProblems: RawProblem[] = [];

  categories.forEach(category => {
    validateProblemCategory(category);

    const problems = parsedData[category];
    if (!Array.isArray(problems)) {
      throw new Error(`Category ${category} should contain an array of problems (e.g. [[C]]).`);
    }

    problems.forEach((problem, index) => {
      const rawProblem = tomlToRawProblem(problem as TomlTable, index, category, imgNames);
      parsedProblems.push(rawProblem);
    });
  });
  return formatProblemsWithAttachments(parsedProblems, S3BucketName);
}

export function validateProblemCategory(category: string): void {
  const validCategories = ['C', 'D', 'E'];
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`);
  }
}
