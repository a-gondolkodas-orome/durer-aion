import type { CompetitionConfig, Problem } from 'schemas';
import {
  combinedCompetitionSource,
  combinedProblemSource,
  fromBanks,
  inCodeCompetitionSource,
  inCodeProblemSource,
  resolveRelay,
} from './sources';

const problem = (id: string, answer: number): Problem => ({
  id, answer, content: { hu: { problemText: `${answer}?` } },
});
const first = problem('aaaaaaaaaa--first', 1);
const second = problem('bbbbbbbbbb--second', 2);
const source = inCodeProblemSource(new Map([[first.id, first], [second.id, second]]));

const relay = { durationMinutes: 60, problems: [{ problemId: second.id, points: 4 }, { problemId: first.id, points: 3 }] };

const competition: CompetitionConfig = {
  id: 'cccccccccc--online-c',
  languages: ['hu'],
  relay,
  metadata: { kind: 'other', label: { hu: 'Próba' } },
};

describe('fromBanks', () => {
  it('keys every entry by its id and gives the id back', () => {
    expect(fromBanks([{ [first.id]: { answer: 1, content: first.content } }, { [second.id]: { answer: 2, content: second.content } }]))
      .toEqual(new Map([[first.id, first], [second.id, second]]));
  });

  it('refuses an id two banks share', () => {
    const bank = { [first.id]: { answer: 1, content: first.content } };
    expect(() => fromBanks([bank, bank])).toThrow(first.id);
  });
});

describe('inCodeProblemSource', () => {
  it('returns the problems it has and leaves out the ids it does not', async () => {
    const found = await source.getProblems([first.id, 'zzzzzzzzzz--missing']);
    expect([...found.entries()]).toEqual([[first.id, first]]);
  });
});

describe('inCodeCompetitionSource', () => {
  it('finds a competition by its id and lists them all', async () => {
    const competitions = inCodeCompetitionSource(new Map([[competition.id, competition]]));
    expect(await competitions.getCompetition(competition.id)).toBe(competition);
    expect(await competitions.getCompetition('zzzzzzzzzz--missing')).toBeUndefined();
    expect(await competitions.listCompetitions()).toEqual([competition]);
  });
});

describe('combinedProblemSource', () => {
  const firstOnly = inCodeProblemSource(new Map([[first.id, first]]));
  const secondOnly = inCodeProblemSource(new Map([[second.id, second]]));

  it('serves the problems of every source', async () => {
    const found = await combinedProblemSource([firstOnly, secondOnly]).getProblems([first.id, second.id, 'zzzzzzzzzz--missing']);
    expect(found).toEqual(new Map([[first.id, first], [second.id, second]]));
  });

  it('refuses a problem two sources hold, naming it', async () => {
    await expect(combinedProblemSource([source, firstOnly]).getProblems([first.id])).rejects.toThrow(first.id);
  });
});

describe('combinedCompetitionSource', () => {
  const other: CompetitionConfig = { ...competition, id: 'dddddddddd--other' };
  const code = inCodeCompetitionSource(new Map([[competition.id, competition]]));
  const database = inCodeCompetitionSource(new Map([[other.id, other]]));

  it('finds a competition in any source and lists them all', async () => {
    const combined = combinedCompetitionSource([code, database]);
    expect(await combined.getCompetition(competition.id)).toBe(competition);
    expect(await combined.getCompetition(other.id)).toBe(other);
    expect(await combined.getCompetition('zzzzzzzzzz--missing')).toBeUndefined();
    expect(await combined.listCompetitions()).toEqual([competition, other]);
  });

  it('refuses a competition two sources hold, naming it', async () => {
    await expect(combinedCompetitionSource([code, code]).getCompetition(competition.id)).rejects.toThrow(competition.id);
  });

  it('lists the others and logs a competition two sources hold', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await combinedCompetitionSource([code, database, code]).listCompetitions()).toEqual([other]);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining(competition.id));
  });
});

describe('resolveRelay', () => {
  it('gives the relay\'s problems in play order, each with its points there', async () => {
    expect(await resolveRelay(relay, source)).toEqual([
      { problem: second, points: 4 },
      { problem: first, points: 3 },
    ]);
  });

  it('refuses a relay that refers to a problem the source does not have', async () => {
    const dangling = { durationMinutes: 60, problems: [{ problemId: 'zzzzzzzzzz--missing', points: 3 }] };
    await expect(resolveRelay(dangling, source)).rejects.toThrow('zzzzzzzzzz--missing');
  });
});
