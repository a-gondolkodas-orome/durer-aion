import { strategyGames } from 'game/strategy';
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
      'feladat aaaaaaaaaa--first: a válasz (1.5) nem egész szám',
      'verseny bbbbbbbbbb--set: nincs ilyen stratégiás játék: nope',
    ]);
  });

  it('reports an id that names both a problem and a competition', () => {
    const clash = createRegistry([{
      problems: { 'aaaaaaaaaa--first': problem },
      competitions: { 'aaaaaaaaaa--first': competition },
    }]);
    expect(validateRegistry(clash, strategyGames)).toEqual([
      'aaaaaaaaaa--first egy feladat és egy verseny azonosítója is',
    ]);
  });

  it('throws every message at once through assertValidRegistry', () => {
    const dangling = createRegistry([{ problems: {}, competitions: { 'bbbbbbbbbb--set': competition } }]);
    expect(() => assertValidRegistry(dangling, strategyGames)).toThrow(
      'hibásak:\n  - verseny bbbbbbbbbb--set: a váltó 1. feladata (aaaaaaaaaa--first) nem létezik',
    );
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
    strategy: { durationMinutes: 30, gameId: 'minta-ketkupac' } };
  const withProblems = (problems: object) => {
    const { competitionSource, problemSource } = createRegistry([{
      problems: problems as never, competitions: { [competition.id]: competition, [valid.id]: valid },
    }]);
    return validatingCompetitionSource(competitionSource, problemSource, strategyGames);
  };

  it('hands out a valid competition as the source has it', async () => {
    const source = withProblems({ 'aaaaaaaaaa--first': { answer: 1, content: { hu: { problemText: '1?' } } } });
    await expect(source.getCompetition(competition.id)).resolves.toMatchObject({ id: competition.id });
    await expect(source.getCompetition('cccccccccc--none')).resolves.toBeUndefined();
  });

  it('refuses one that refers to a problem the problem source does not have', async () => {
    const source = withProblems({});
    await expect(source.getCompetition(competition.id)).rejects.toThrow('A verseny hibás: bbbbbbbbbb--set\n  - verseny bbbbbbbbbb--set: a váltó 1. feladata (aaaaaaaaaa--first) nem létezik');
  });

  it('lists the valid competitions, and logs an invalid one rather than failing them all', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    onTestFinished(() => { logged.mockRestore(); });
    const source = withProblems({});
    await expect(source.listCompetitions()).resolves.toEqual([valid]);
    expect(logged).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(competition.id));
  });
});
