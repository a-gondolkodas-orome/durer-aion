import type { VariantInput } from './types';

export const resolveVariants = <TBoard,>(variants: VariantInput<TBoard>[]) => {
  if (!variants || variants.length === 0) {
    throw new Error('strategyGameFactory: variants must be a non-empty array');
  }
  if (variants.length > 1 && variants.filter(v => v.isDefault).length !== 1) {
    throw new Error('strategyGameFactory: exactly one variant must have isDefault: true');
  }
  const defaultVariantIndex = Math.max(variants.findIndex(v => v.isDefault), 0);
  const defaultVariant = variants[defaultVariantIndex];
  if (!defaultVariant.generateStartBoard) {
    throw new Error('strategyGameFactory: the default variant must define generateStartBoard');
  }
  const fallbackBotStrategy = defaultVariant.botStrategy
    ?? variants.find(v => v.botStrategy)?.botStrategy;
  const resolvedVariants = variants.map(v => ({ ...v, botStrategy: v.botStrategy ?? fallbackBotStrategy }));
  return { defaultVariantIndex, defaultVariant, resolvedVariants };
};
