import type { CompetitionConfig, Language, LocalizedLabel, RelayConfig, Round } from 'schemas';
import { LANGUAGES } from 'schemas';

// The settings form of a database competition's edit page: everything of
// `CompetitionConfig` but the relay's problems (relay-form.ts), as the fields
// hold it — text, as typed. The validator on the server decides what is valid; the form
// only refuses what it cannot turn into a competition at all, a number that
// is not one.

export interface SettingsForm {
  kind: 'competition' | 'other';
  edition: string;
  round: Round;
  category: string;
  label: Record<Language, string>;
  languages: Language[];
  hasRelay: boolean;
  relayMinutes: string;
  hasStrategy: boolean;
  gameId: string;
  strategyMinutes: string;
  opensAt: string;
  closesAt: string;
  advancingPoints: string;
  finishMessage: Record<Language, string>;
}

const byLanguage = (label: LocalizedLabel | undefined): Record<Language, string> =>
  Object.fromEntries(LANGUAGES.map(language => [language, label?.[language] ?? ''])) as Record<Language, string>;

/// The languages given a text, none an empty one. Undefined for none at all,
/// the way the config leaves out a label it has not.
function localized(texts: Record<Language, string>): LocalizedLabel | undefined {
  const entries = LANGUAGES.map(language => [language, texts[language].trim()] as const).filter(([, text]) => text !== '');
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

export function settingsForm(competition: CompetitionConfig): SettingsForm {
  const { metadata } = competition;
  return {
    kind: metadata.kind,
    edition: metadata.kind === 'competition' ? String(metadata.edition) : '',
    round: metadata.kind === 'competition' ? metadata.round : 'online',
    category: metadata.kind === 'competition' ? metadata.category : '',
    label: byLanguage(metadata.label),
    languages: competition.languages,
    hasRelay: competition.relay !== undefined,
    relayMinutes: String(competition.relay?.durationMinutes ?? ''),
    hasStrategy: competition.strategy !== undefined,
    gameId: competition.strategy?.gameId ?? '',
    strategyMinutes: String(competition.strategy?.durationMinutes ?? ''),
    opensAt: competition.startWindow?.opensAt ?? '',
    closesAt: competition.startWindow?.closesAt ?? '',
    advancingPoints: String(competition.advancingPoints ?? ''),
    finishMessage: byLanguage(competition.finishMessage),
  };
}

/// The form's fields whose text is no whole number, by the field's name.
export type FieldErrors = Partial<Record<'edition' | 'relayMinutes' | 'strategyMinutes' | 'advancingPoints', string>>;

const NOT_A_NUMBER = 'Egész számot írj ide.';

/// The competition the form describes, `original` changed by it, with
/// `relayProblems` for its relay's, which the relay's editor composes; the id
/// stays.
export function competitionFromForm(
  form: SettingsForm, original: CompetitionConfig,
  relayProblems: RelayConfig['problems'] = original.relay?.problems ?? [],
): { competition: CompetitionConfig } | { fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};
  // A field in use, `optional` or not, that holds no whole number is an error,
  // and reads as 0 here, which the return below never lets out.
  const integer = (field: keyof FieldErrors, inUse = true, optional = false): number | undefined => {
    const text = form[field].trim();
    if (!inUse || (text === '' && optional)) return undefined;
    if (/^-?\d+$/.test(text)) return Number(text);
    fieldErrors[field] = NOT_A_NUMBER;
    return 0;
  };
  const edition = integer('edition', form.kind === 'competition') ?? 0;
  const relayMinutes = integer('relayMinutes', form.hasRelay) ?? 0;
  const strategyMinutes = integer('strategyMinutes', form.hasStrategy) ?? 0;
  const advancingPoints = integer('advancingPoints', true, true);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const label = localized(form.label);
  const finishMessage = localized(form.finishMessage);
  const opensAt = form.opensAt.trim();
  const closesAt = form.closesAt.trim();
  const competition: CompetitionConfig = {
    id: original.id,
    // In the order the platform lists them, whatever order they were ticked in.
    languages: LANGUAGES.filter(language => form.languages.includes(language)),
    ...(opensAt !== '' || closesAt !== '' ? { startWindow: { opensAt, ...(closesAt !== '' && { closesAt }) } } : {}),
    ...(form.hasRelay && {
      relay: { durationMinutes: relayMinutes, problems: relayProblems },
    }),
    ...(form.hasStrategy && { strategy: { durationMinutes: strategyMinutes, gameId: form.gameId.trim() } }),
    ...(advancingPoints !== undefined && { advancingPoints }),
    ...(finishMessage !== undefined && { finishMessage }),
    metadata: form.kind === 'competition'
      ? { kind: 'competition', edition, round: form.round, category: form.category.trim(), ...(label && { label }) }
      // A practice set is listed by its label alone, so the validator asks for
      // one: an empty one is sent for it to name.
      : { kind: 'other', label: label ?? {} },
  };
  return { competition };
}

/// The form a new competition starts from: a Hungarian online round with both
/// matches, at the lengths the games default to, for the organiser to fill in.
export function newSettingsForm(): SettingsForm {
  return {
    ...settingsForm({ id: '', languages: ['hu'], metadata: { kind: 'competition', edition: 0, round: 'online', category: '' } }),
    edition: '',
    hasRelay: true,
    relayMinutes: '60',
    hasStrategy: true,
    strategyMinutes: '30',
  };
}

/// Text as a slug, as far as it can be: accents dropped, lowercase, anything
/// but a letter or digit a single dash between words.
export function slugify(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/// The slug a new competition's id is offered, until the organiser types one:
/// edition, round and category, as the bank files name theirs
/// (`04-final-b`), or a practice set's label.
export function suggestedSlug(form: SettingsForm): string {
  if (form.kind === 'other') return slugify(form.label.hu || form.label.en);
  const edition = form.edition.trim();
  return slugify([/^\d$/.test(edition) ? `0${edition}` : edition, form.round, form.category].join(' '));
}
