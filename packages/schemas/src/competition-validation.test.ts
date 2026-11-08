import {
  CompetitionConfig, editionSchoolYear, isEntityId, localizeLabel, localizeProblem, Problem, RelayConfig, StrategyConfig,
} from './competition';
import { CompetitionReferences, validateCompetition, validateProblem } from './competition-validation';

const bilingual: Problem = {
  id: 'k3x9q2m7ab--hatszog-terulet',
  answer: 12,
  content: {
    hu: { problemText: 'Mennyi?', imageUrl: 'https://example.com/a.png', help1: 'Tipp' },
    en: { problemText: 'How much?' },
  },
};

const hungarianOnly: Problem = {
  id: 'p0q1r2s3t4--bolhapiac',
  answer: 133,
  content: { hu: { problemText: 'Hány tányér?' } },
};

const relay: RelayConfig = {
  durationMinutes: 60,
  problems: [
    { problemId: hungarianOnly.id, points: 3 },
    { problemId: bilingual.id, points: 4 },
  ],
};

const strategy: StrategyConfig = { durationMinutes: 30, gameId: '19o-c' };

// Neither match yet: each test adds the ones it is about.
const base: CompetitionConfig = {
  id: 'a1b2c3d4e5--online-c',
  languages: ['hu'],
  metadata: { kind: 'competition', edition: 19, round: 'online', category: 'C' },
};

const competition: CompetitionConfig = {
  ...base,
  startWindow: { opensAt: '2026-10-20T15:00:00+02:00', closesAt: '2026-10-20T21:30:00+02:00' },
  relay,
  strategy,
};

const references: CompetitionReferences = {
  problems: new Map([bilingual, hungarianOnly].map(problem => [problem.id, problem])),
  strategyGames: new Map([['19o-c', { languages: ['hu'] }]]),
};

describe('isEntityId', () => {
  it('takes ten random characters, two dashes and a kebab-case slug', () => {
    expect(isEntityId('k3x9q2m7ab--hatszog-terulet')).toBe(true);
    expect(isEntityId('k3x9q2m7ab--e')).toBe(true);
  });

  it.each([
    ['a random part of the wrong length', 'k3x9q2m7a--slug'],
    ['an uppercase letter', 'K3x9q2m7ab--slug'],
    ['no slug', 'k3x9q2m7ab--'],
    ['a single dash', 'k3x9q2m7ab-slug'],
    ['a doubled dash in the slug', 'k3x9q2m7ab--a--b'],
    ['an accented slug', 'k3x9q2m7ab--hatszög'],
    ['an underscore', 'k3x9q2m7ab--a_b'],
  ])('refuses %s', (_, id) => {
    expect(isEntityId(id)).toBe(false);
  });
});

describe('validateProblem', () => {
  it('accepts a problem in one language or in both', () => {
    expect(validateProblem(bilingual)).toEqual([]);
    expect(validateProblem(hungarianOnly)).toEqual([]);
  });

  it('refuses a malformed id', () => {
    expect(validateProblem({ ...hungarianOnly, id: '2026-c-1' })).toHaveLength(1);
  });

  it('refuses a problem with no content, or an empty text', () => {
    expect(validateProblem({ ...hungarianOnly, content: {} })).toEqual([
      `problem ${hungarianOnly.id}: has no content in any language`,
    ]);
    expect(validateProblem({ ...hungarianOnly, content: { hu: { problemText: ' ' } } })).toEqual([
      `problem ${hungarianOnly.id}: its hu text is empty`,
    ]);
  });

  it('refuses an answer that is not an integer', () => {
    expect(validateProblem({ ...hungarianOnly, answer: 1.5 })).toEqual([
      `problem ${hungarianOnly.id}: the answer 1.5 is not an integer`,
    ]);
  });
});

describe('localizeProblem', () => {
  it('takes each field from the team\'s language where the problem has it', () => {
    expect(localizeProblem(bilingual, 'en').problemText).toBe('How much?');
    expect(localizeProblem(bilingual, 'hu')).toEqual({
      problemText: 'Mennyi?', imageUrl: 'https://example.com/a.png', help1: 'Tipp', help2: undefined,
    });
  });

  it('falls back to another language field by field, so a shared image is given once', () => {
    expect(localizeProblem(bilingual, 'en')).toEqual({
      problemText: 'How much?', imageUrl: 'https://example.com/a.png', help1: 'Tipp', help2: undefined,
    });
  });

  it('shows a problem with no content in the team\'s language in another one', () => {
    expect(localizeProblem(hungarianOnly, 'en').problemText).toBe('Hány tányér?');
  });
});

describe('validateCompetition', () => {
  it('accepts a competition whose references all resolve', () => {
    expect(validateCompetition(competition, references)).toEqual([]);
  });

  it('accepts a relay-only or a strategy-only competition, with no window', () => {
    expect(validateCompetition({ ...base, relay }, references)).toEqual([]);
    expect(validateCompetition({ ...base, strategy }, references)).toEqual([]);
  });

  it('accepts a window with no end', () => {
    const openEnded = { ...competition, startWindow: { opensAt: '2026-10-20T13:00:00Z' } };
    expect(validateCompetition(openEnded, references)).toEqual([]);
  });

  it('refuses a competition with neither match', () => {
    expect(validateCompetition(base, references)).toEqual([
      `competition ${competition.id}: has neither a relay nor a strategy game`,
    ]);
  });

  it('refuses a malformed id', () => {
    expect(validateCompetition({ ...competition, id: 'online-c' }, references)).toHaveLength(1);
  });

  it('refuses no language, or one named twice', () => {
    // Its relay problems and strategy game are then in none of its languages too.
    expect(validateCompetition({ ...competition, languages: [] }, references)).toContain(
      `competition ${competition.id}: has no language`,
    );
    expect(validateCompetition({ ...competition, languages: ['hu', 'hu'] }, references)).toEqual([
      `competition ${competition.id}: names a language twice`,
    ]);
  });

  it('refuses a window time without an offset, which would be read in local time', () => {
    const local = { ...competition, startWindow: { opensAt: '2026-10-20T15:00:00' } };
    expect(validateCompetition(local, references)).toEqual([
      `competition ${competition.id}: opensAt "2026-10-20T15:00:00" is not an ISO 8601 time with an offset`,
    ]);
  });

  it('refuses a window that closes before it opens', () => {
    const backwards = { ...competition, startWindow: { opensAt: '2026-10-20T15:00:00Z', closesAt: '2026-10-20T14:00:00Z' } };
    expect(validateCompetition(backwards, references)).toEqual([
      `competition ${competition.id}: closesAt is not after opensAt`,
    ]);
  });

  it('refuses a duration that is not a positive whole number of minutes', () => {
    const zero = { ...relay, durationMinutes: 0 };
    const fractional = { ...strategy, durationMinutes: 7.5 };
    expect(validateCompetition({ ...base, relay: zero, strategy: fractional }, references)).toHaveLength(2);
  });

  it('refuses an empty relay', () => {
    expect(validateCompetition({ ...base, relay: { ...relay, problems: [] } }, references)).toEqual([
      `competition ${competition.id}: the relay has no problems`,
    ]);
  });

  it('refuses a relay problem that is unknown, repeated or not worth a positive integer', () => {
    const faulty = {
      ...relay,
      problems: [
        { problemId: hungarianOnly.id, points: 3 },
        { problemId: hungarianOnly.id, points: 0 },
        { problemId: 'zzzzzzzzzz--missing', points: 3 },
      ],
    };
    expect(validateCompetition({ ...base, relay: faulty }, references)).toEqual([
      `competition ${competition.id}: relay problem 2 (${hungarianOnly.id}) is already in the relay`,
      `competition ${competition.id}: relay problem 2 (${hungarianOnly.id}) is worth 0 points, not a positive integer`,
      `competition ${competition.id}: relay problem 3 (zzzzzzzzzz--missing) does not exist`,
    ]);
  });

  it('accepts a relay problem missing one of the competition\'s languages, which is shown in another', () => {
    expect(validateCompetition({ ...base, languages: ['hu', 'en'], relay }, references)).toEqual([]);
  });

  it('refuses a relay problem in none of the competition\'s languages', () => {
    expect(validateCompetition({ ...base, languages: ['en'], relay }, references)).toEqual([
      `competition ${competition.id}: relay problem 1 (${hungarianOnly.id}) is in none of the competition's languages`,
    ]);
  });

  it('refuses a strategy game that is not registered, or in none of the competition\'s languages', () => {
    const unknown = { ...base, strategy: { ...strategy, gameId: 'stones-e' } };
    expect(validateCompetition(unknown, references)).toEqual([
      `competition ${competition.id}: the strategy game stones-e is not registered`,
    ]);
    expect(validateCompetition({ ...base, languages: ['en'], strategy }, references)).toEqual([
      `competition ${competition.id}: the strategy game 19o-c is in none of the competition's languages`,
    ]);
    expect(validateCompetition({ ...base, languages: ['hu', 'en'], strategy }, references)).toEqual([]);
  });

  it('accepts an `other` competition, listed by its label alone', () => {
    const algebra: CompetitionConfig = { ...base, relay, metadata: { kind: 'other', label: { hu: 'Algebra 9. osztály' } } };
    expect(validateCompetition(algebra, references)).toEqual([]);
  });

  it('refuses an edition that is not a positive integer, or an empty category', () => {
    const metadata = { kind: 'competition', edition: 0, round: 'final', category: ' ' } as const;
    expect(validateCompetition({ ...base, relay, metadata }, references)).toEqual([
      `competition ${competition.id}: the edition 0 is not a positive integer`,
      `competition ${competition.id}: the category is empty`,
    ]);
  });

  it('refuses a label in no language, or an empty one', () => {
    expect(validateCompetition({ ...base, relay, metadata: { kind: 'other', label: {} } }, references)).toEqual([
      `competition ${competition.id}: the label is in no language`,
    ]);
    const metadata = { kind: 'competition', edition: 19, round: 'online', category: 'E+', label: { en: '' } } as const;
    expect(validateCompetition({ ...base, relay, metadata }, references)).toEqual([
      `competition ${competition.id}: the en label is empty`,
    ]);
  });
});

describe('localizeLabel', () => {
  it('falls back to another language where the reader\'s is missing', () => {
    expect(localizeLabel({ hu: 'Nemzetközi', en: 'International' }, 'en')).toBe('International');
    expect(localizeLabel({ hu: 'Nemzetközi' }, 'en')).toBe('Nemzetközi');
  });
});

describe('editionSchoolYear', () => {
  it('names the school year as the strategy practice catalogue does', () => {
    expect(editionSchoolYear(1)).toBe('07/08');
    expect(editionSchoolYear(19)).toBe('25/26');
    expect(editionSchoolYear(20)).toBe('26/27');
  });
});
