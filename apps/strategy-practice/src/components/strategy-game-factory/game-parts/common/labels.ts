import type { Label } from 'strategy-engine';

// The two labels most games give their variants: a test bot and the real one.
export const testVariantLabel: Label = t => t('factory:variant.test');
export const fullVariantLabel: Label = t => t('factory:variant.full');
