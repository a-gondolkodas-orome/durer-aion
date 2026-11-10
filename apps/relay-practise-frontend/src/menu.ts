import type { CompetitionMetadata, Language, Round } from 'schemas';
import { localizeLabel } from 'schemas';

// The round selector, built from the listed competitions' metadata: a past
// round is picked by category, round and edition, any other set by its label.

interface Listed {
  id: string;
  metadata: CompetitionMetadata;
}

export interface PastRound {
  id: string;
  edition: number;
  round: Round;
  category: string;
}

export interface OtherSet {
  id: string;
  label: string;
}

// C+ and D+ (years 9–11) match E and E+ in difficulty, so the selector lists
// them under those; the header keeps the real category.
export const listedCategory = (category: string): string =>
  category === 'C+' ? 'E' : category === 'D+' ? 'E+' : category;

export const categoryOptionLabel = (category: string): string =>
  category === 'E' ? 'E / C+' : category === 'E+' ? 'E+ / D+' : category;

// The selector's order; a category not named here comes after these.
const CATEGORY_ORDER = ['A', 'B', 'C', 'D', 'E', 'E+'];
const ROUND_ORDER: readonly Round[] = ['local', 'final', 'online'];

const categoryRank = (category: string) => {
  const rank = CATEGORY_ORDER.indexOf(category);
  return rank === -1 ? CATEGORY_ORDER.length : rank;
};

export const pastRounds = (sets: readonly Listed[]): PastRound[] =>
  sets.flatMap(({ id, metadata }) => metadata.kind === 'competition'
    ? [{ id, edition: metadata.edition, round: metadata.round, category: metadata.category }]
    : []);

export const menuCategories = (rounds: readonly PastRound[]): string[] =>
  [...new Set(rounds.map(({ category }) => listedCategory(category)))]
    .sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b));

export const menuRounds = (rounds: readonly PastRound[], category: string): Round[] =>
  ROUND_ORDER.filter(round => rounds.some(each => listedCategory(each.category) === category && each.round === round));

export const menuEditions = (rounds: readonly PastRound[], category: string, round: Round): PastRound[] =>
  rounds
    .filter(each => listedCategory(each.category) === category && each.round === round)
    .sort((a, b) => a.edition - b.edition || a.category.localeCompare(b.category));

export const otherSets = (sets: readonly Listed[], language: Language): OtherSet[] =>
  sets.flatMap(({ id, metadata }) => metadata.kind === 'other'
    ? [{ id, label: localizeLabel(metadata.label, language) ?? id }]
    : []);
