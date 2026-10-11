import type { TFunction } from 'i18next';
import { translate, type I18nString, type Label, type Language } from 'language';

// The two labels most games give their variants: a test bot and the real one.
export const testVariantLabel: Label = t => t('factory:variant.test');
export const fullVariantLabel: Label = t => t('factory:variant.full');

/** A variant or role label as text, in either form a game writes one. */
export const labelText = (label: I18nString | Label, t: TFunction<'factory'>, language: Language): string =>
  typeof label === 'function' ? label(t) : translate(label, language);
