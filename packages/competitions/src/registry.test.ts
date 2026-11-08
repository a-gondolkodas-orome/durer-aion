import { strategyGames } from 'game';
import { validateCompetition, validateProblem } from 'schemas';
import { competitions, problems } from './registry';

const references = {
  problems: new Map(problems.map(problem => [problem.id, problem])),
  strategyGames: new Map(Object.entries(strategyGames)),
};

describe('the registry', () => {
  it.each(problems.map(problem => [problem.id, problem] as const))('holds a valid problem %s', (_, problem) => {
    expect(validateProblem(problem)).toEqual([]);
  });

  it.each(competitions.map(competition => [competition.id, competition] as const))(
    'holds a valid competition %s',
    (_, competition) => {
      expect(validateCompetition(competition, references)).toEqual([]);
    },
  );

  // A problem and a competition never share an id either: the format is the
  // same, and an id names one thing wherever it is read.
  it('gives every problem and competition an id of its own', () => {
    const ids = [...problems, ...competitions].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
