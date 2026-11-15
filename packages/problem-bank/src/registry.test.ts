import { strategyGames } from 'game';
import type { CompetitionConfig } from 'schemas';
import { registry } from '../all';
import { assertValidRegistry, createRegistry, validateRegistry } from './registry';

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
