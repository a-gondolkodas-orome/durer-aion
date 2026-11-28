import type { Problem } from 'schemas';
import type { ContentSources } from './database_sources';
import { type ProblemUse, problemUses } from './competition_view';
import { CompetitionModel, ProblemModel } from './model';

// The relay editor's picker: the database's problems, found by id or slug, or
// by a competition whose relay uses them, to add to another relay by id.

export interface ProblemSearchResult {
  problem: Problem;
  storedIn: 'database';
  /** Every use of the problem, in-code and database competitions alike. */
  uses: ProblemUse[];
}

export interface ProblemSearchView {
  problems: ProblemSearchResult[];
  /** More problems match than `PROBLEM_SEARCH_LIMIT`: the search is to be narrowed. */
  truncated: boolean;
}

export const PROBLEM_SEARCH_LIMIT = 50;

const slugOf = (id: string) => id.split('--').slice(1).join('--');

/** The database problems whose id holds `q`, ignoring case, and, with
 *  `competition`, which that competition's relay uses: in its relay's order
 *  then, by slug otherwise. Everything as stored, unvalidated, as the problem
 *  editor reads it: the competition's save says what a broken one breaks.
 *  Undefined for a competition no one holds. */
export async function searchProblems(
  { q = '', competition }: { q?: string, competition?: string },
  { competitions }: Pick<ContentSources, 'competitions'>,
): Promise<ProblemSearchView | undefined> {
  const rows = await CompetitionModel.findAll({ order: [['id', 'ASC']] });
  const all = [...competitions.values(), ...rows.map(({ id, body }) => ({ ...body, id }))];
  if (competition !== undefined && !all.some(({ id }) => id === competition)) return undefined;
  const uses = problemUses(all);
  const needle = q.trim().toLowerCase();
  const order = (id: string) => uses.get(id)?.find(use => use.competitionId === competition)?.position;

  const found = (await ProblemModel.findAll({ order: [['id', 'ASC']] }))
    .filter(({ id }) => id.toLowerCase().includes(needle))
    .filter(({ id }) => competition === undefined || order(id) !== undefined)
    .sort((a, b) => competition === undefined
      ? slugOf(a.id).localeCompare(slugOf(b.id)) || a.id.localeCompare(b.id)
      : (order(a.id) ?? 0) - (order(b.id) ?? 0));
  return {
    problems: found.slice(0, PROBLEM_SEARCH_LIMIT).map(({ id, body }) => ({
      problem: { ...body, id }, storedIn: 'database', uses: uses.get(id) ?? [],
    })),
    truncated: found.length > PROBLEM_SEARCH_LIMIT,
  };
}
