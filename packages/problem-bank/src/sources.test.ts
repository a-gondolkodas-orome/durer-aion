import type { CompetitionConfig, Problem } from 'schemas';
import { fromBanks, inCodeCompetitionSource, inCodeProblemSource, resolveRelay } from './sources';

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
