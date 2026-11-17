import { validateCompetition, validateProblem, type CompetitionConfig, type ValidationFinding } from 'schemas';
import i18next from '../../common/i18n';
import { findingMessage } from './validation-finding';

const hu = i18next.getFixedT('hu');
const en = i18next.getFixedT('en');

const competition: CompetitionConfig = {
  id: 'a1b2c3d4e5--online-c',
  languages: ['hu'],
  metadata: { kind: 'competition', edition: 19, round: 'online', category: 'C' },
  relay: { durationMinutes: 60, problems: [{ problemId: 'zzzzzzzzzz--missing', points: 0 }] },
};
const noReferences = { problems: new Map(), strategyGames: new Map() };

describe('findingMessage', () => {
  it('names what the finding is about, then what is wrong, in Hungarian', () => {
    const [finding] = validateProblem({ id: 'p0q1r2s3t4--bolhapiac', answer: 1.5, content: { hu: { problemText: '?' } } });
    expect(findingMessage(finding, hu)).toBe('feladat p0q1r2s3t4--bolhapiac: a válasz (1.5) nem egész szám');
  });

  it('names a relay problem by its place in the relay', () => {
    expect(validateCompetition(competition, noReferences).map(finding => findingMessage(finding, hu))).toEqual([
      'verseny a1b2c3d4e5--online-c, a váltó 1. feladata (zzzzzzzzzz--missing): a pontértéke (0) nem pozitív egész szám',
      'verseny a1b2c3d4e5--online-c, a váltó 1. feladata (zzzzzzzzzz--missing): nincs ilyen feladat',
    ]);
  });

  it('shows a finding with no subject as its text alone', () => {
    const clash: ValidationFinding = { code: 'ID_NAMES_BOTH', params: { id: 'aaaaaaaaaa--first' } };
    expect(findingMessage(clash, hu)).toBe('a(z) aaaaaaaaaa--first azonosító egy feladaté és egy versenyé is');
  });

  it('follows the language it is given', () => {
    const [finding] = validateCompetition({ ...competition, relay: undefined }, noReferences);
    expect(findingMessage(finding, en)).toBe('competition a1b2c3d4e5--online-c: has neither a relay nor a strategy game');
  });
});
