import type { TFunction } from 'i18next';
import { localizeLabel } from 'schemas';
import type { Language, PublicCompetition } from 'schemas';

/// The header's two lines: what the site is and which part of it the team is in.
export interface Heading {
  title: string;
  subtitle: string;
}

const ROMAN = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
] as const;

/// The Dürer names its editions in Roman numerals: the 20th is XX.
export function romanNumeral(value: number): string {
  let rest = value;
  let numeral = '';
  for (const [worth, letters] of ROMAN) {
    while (rest >= worth) {
      numeral += letters;
      rest -= worth;
    }
  }
  return numeral;
}

/// The header and the tab title, from the team's competition: a round of the
/// Dürer is named by its edition and round, anything else by its label. Before
/// login, and for a competition the server no longer has, there is no edition
/// to name, and the site is the online round's.
export function competitionHeading(
  competition: PublicCompetition | null | undefined, language: Language, t: TFunction,
): Heading {
  const metadata = competition?.metadata;
  if (metadata === undefined) {
    return { title: t('header.titlePlain'), subtitle: t('header.subtitle') };
  }
  if (metadata.kind === 'other') {
    return { title: t('header.titlePlain'), subtitle: localizeLabel(metadata.label, language) ?? '' };
  }
  return {
    title: t('header.titleOfEdition', { edition: romanNumeral(metadata.edition) }),
    // t('header.round.online'), t('header.round.local'), t('header.round.final')
    subtitle: t(`header.round.${metadata.round}`),
  };
}
