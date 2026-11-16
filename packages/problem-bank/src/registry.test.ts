import { strategyGames } from 'game';
import type { CompetitionConfig } from 'schemas';
import { registry } from '../all';
import { assertValidRegistry, createRegistry, validateRegistry, validatingCompetitionSource } from './registry';

describe('the registry of every bank', () => {
  it('is valid', () => {
    expect(validateRegistry(registry, strategyGames)).toEqual([]);
  });
});

describe('validateRegistry', () => {
  const problem = { answer: 1, content: { hu: { problemText: '1?' } } };
  const competition: Omit<CompetitionConfig, 'id'> = {
    languages: ['hu'],
    relay: { durationMinutes: 60, problems: [{ problemId: 'aaaaaaaaaa--first', points: 3 }] },
    metadata: { kind: 'other', label: { hu: 'Próba' } },
  };

  it('reports a problem and a competition that break the rules', () => {
    const broken = createRegistry([{
      problems: { 'aaaaaaaaaa--first': { ...problem, answer: 1.5 } },
      competitions: { 'bbbbbbbbbb--set': { ...competition, strategy: { durationMinutes: 30, gameId: 'nope' } } },
    }]);
    expect(validateRegistry(broken, strategyGames)).toEqual([
      expect.stringContaining('aaaaaaaaaa--first: the answer 1.5'),
      expect.stringContaining('the strategy game nope is not registered'),
    ]);
  });

  it('reports an id that names both a problem and a competition', () => {
    const clash = createRegistry([{
      problems: { 'aaaaaaaaaa--first': problem },
      competitions: { 'aaaaaaaaaa--first': competition },
    }]);
    expect(validateRegistry(clash, strategyGames)).toEqual([
      'aaaaaaaaaa--first names both a problem and a competition',
    ]);
  });

  it('throws every message at once through assertValidRegistry', () => {
    const dangling = createRegistry([{ problems: {}, competitions: { 'bbbbbbbbbb--set': competition } }]);
    expect(() => assertValidRegistry(dangling, strategyGames)).toThrow(/invalid:\n {2}- .*aaaaaaaaaa--first\) does not exist/);
  });
});

describe('createRegistry', () => {
  it('refuses an id two banks share', () => {
    const bank = { problems: { 'aaaaaaaaaa--first': { answer: 1, content: { hu: { problemText: '1?' } } } }, competitions: {} };
    expect(() => createRegistry([bank, bank])).toThrow('aaaaaaaaaa--first');
  });
});

describe('validatingCompetitionSource', () => {
  const competition: CompetitionConfig = {
    id: 'bbbbbbbbbb--set',
    languages: ['hu'],
    relay: { durationMinutes: 60, problems: [{ problemId: 'aaaaaaaaaa--first', points: 3 }] },
    metadata: { kind: 'other', label: { hu: 'Próba' } },
  };
  const valid: CompetitionConfig = { ...competition, id: 'dddddddddd--valid', relay: undefined,
    strategy: { durationMinutes: 30, gameId: '20o-c' } };
  const invalid: Error[] = [];
  const withProblems = (problems: object) => {
    const { competitionSource, problemSource } = createRegistry([{
      problems: problems as never, competitions: { [competition.id]: competition, [valid.id]: valid },
    }]);
    return validatingCompetitionSource(competitionSource, problemSource, strategyGames, error => { invalid.push(error); });
  };
  beforeEach(() => { invalid.length = 0; });

  it('hands out a valid competition as the source has it', async () => {
    const source = withProblems({ 'aaaaaaaaaa--first': { answer: 1, content: { hu: { problemText: '1?' } } } });
    await expect(source.getCompetition(competition.id)).resolves.toMatchObject({ id: competition.id });
    await expect(source.getCompetition('cccccccccc--none')).resolves.toBeUndefined();
  });

  it('refuses one that refers to a problem the problem source does not have', async () => {
    const source = withProblems({});
    await expect(source.getCompetition(competition.id)).rejects.toThrow('aaaaaaaaaa--first) does not exist');
  });

  it('lists the valid competitions, and reports an invalid one rather than failing them all', async () => {
    const source = withProblems({});
    await expect(source.listCompetitions()).resolves.toEqual([valid]);
    expect(invalid.map(({ message }) => message)).toEqual([expect.stringContaining(competition.id)]);
  });

  it('checks a competition the source hands out again only when it is a new object', async () => {
    let reads = 0;
    const problemSource = {
      getProblems: (ids: readonly string[]) => {
        reads += 1;
        return Promise.resolve(new Map(ids.map(id => [id, { id, answer: 1, content: { hu: { problemText: '1?' } } }])));
      },
    };
    let current = competition;
    const source = validatingCompetitionSource({
      getCompetition: () => Promise.resolve(current),
      listCompetitions: () => Promise.resolve([current]),
    }, problemSource, strategyGames);
    await source.getCompetition(competition.id);
    await source.getCompetition(competition.id);
    expect(reads).toBe(1);
    current = { ...competition };
    await source.getCompetition(competition.id);
    expect(reads).toBe(2);
  });
});
