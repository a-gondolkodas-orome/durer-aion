import type { PostgresStore } from 'bgio-postgres';
import { Sequelize } from 'sequelize';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamsRepository, escapeLike } from './db';
import { TeamModel } from './model';

// The point of these tests is the SQL `fetch` asks for, so the repository gets a
// postgres Sequelize that is never connected: `findAll` is stubbed, and the query
// it was handed is rendered by the same query generator the driver would use.
const sequelize = new Sequelize('db', 'user', 'password', {
  dialect: 'postgres',
  logging: false,
});

const queryGenerator = sequelize.getQueryInterface().queryGenerator as {
  selectQuery(
    table: string,
    options: { where: unknown; model: typeof TeamModel },
    model: typeof TeamModel,
  ): string;
};

/** The SELECT `fetch` would run for this filter. */
async function fetchQuery(filter: string[]): Promise<string> {
  const findAll = vi.spyOn(TeamModel, 'findAll').mockResolvedValue([]);
  await new TeamsRepository({ sequelize } as unknown as PostgresStore).fetch(filter);
  const { where } = findAll.mock.calls[0][0] ?? {};
  return queryGenerator.selectQuery('Teams', { where, model: TeamModel }, TeamModel);
}

describe('escapeLike', () => {
  it('leaves an ordinary fragment alone', () => {
    expect(escapeLike('Budapest')).toBe('Budapest');
  });

  it('escapes the wildcards and the escape character itself', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('back\\slash')).toBe('back\\\\slash');
  });
});

describe('TeamsRepository.fetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches teams whose other field contains the fragment, whatever its case', async () => {
    // Rendered SQL is all these tests see, so the operator is what they can
    // hold: `ILIKE` is what makes `budapest` find `Budapest`.
    const query = await fetchQuery(['Budapest']);
    expect(query).toContain(`"other" ILIKE '%Budapest%'`);
    expect(query).not.toContain(' LIKE ');
  });

  it('requires every fragment', async () => {
    const query = await fetchQuery(['Budapest', 'C']);
    expect(query).toContain(`"other" ILIKE '%Budapest%' AND`);
    expect(query).toContain(`"other" ILIKE '%C%'`);
  });

  it('treats % in a fragment as a literal, not as "match everything"', async () => {
    expect(await fetchQuery(['100%'])).toContain(`"other" ILIKE '%100\\%%'`);
  });

  it('treats _ in a fragment as a literal, not as "match any character"', async () => {
    expect(await fetchQuery(['a_b'])).toContain(`"other" ILIKE '%a\\_b%'`);
  });

  it('returns every team for an empty filter', async () => {
    expect(await fetchQuery([])).not.toContain('WHERE');
  });
});

describe('TeamsRepository.finishMatch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes only while the team still holds that match', async () => {
    const update = vi.spyOn(TeamModel, 'update').mockResolvedValue([0]);
    const finished = { state: 'FINISHED', matchID: 'm-1', startAt: new Date(), endAt: new Date(), score: 3 } as const;

    const written = await new TeamsRepository({ sequelize } as unknown as PostgresStore)
      .finishMatch('team-1', 'strategyMatch', 'm-1', finished);

    expect(written).toBe(false);
    const [values, options] = update.mock.calls[0];
    expect(values).toStrictEqual({ strategyMatch: finished });
    const query = queryGenerator.selectQuery('Teams', { where: options.where, model: TeamModel }, TeamModel);
    expect(query).toContain(`"teamId" = 'team-1'`);
    expect(query).toContain(`."strategyMatch"#>>'{matchID}') = 'm-1'`);
  });
});
