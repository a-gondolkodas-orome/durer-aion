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

  it('matches teams whose other field contains the fragment', async () => {
    expect(await fetchQuery(['Budapest'])).toContain(`"other" LIKE '%Budapest%'`);
  });

  it('requires every fragment', async () => {
    const query = await fetchQuery(['Budapest', 'C']);
    expect(query).toContain(`"other" LIKE '%Budapest%' AND`);
    expect(query).toContain(`"other" LIKE '%C%'`);
  });

  it('treats % in a fragment as a literal, not as "match everything"', async () => {
    expect(await fetchQuery(['100%'])).toContain(`"other" LIKE '%100\\%%'`);
  });

  it('treats _ in a fragment as a literal, not as "match any character"', async () => {
    expect(await fetchQuery(['a_b'])).toContain(`"other" LIKE '%a\\_b%'`);
  });

  it('returns every team for an empty filter', async () => {
    expect(await fetchQuery([])).not.toContain('WHERE');
  });
});
