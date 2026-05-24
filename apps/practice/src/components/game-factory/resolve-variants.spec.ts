import { resolveVariants } from './resolve-variants';
import type { VariantInput } from './types';

type Board = string[];

const makeVariant = (overrides: VariantInput<Board> = {}) => ({
  generateStartBoard: (): Board => [],
  botStrategy: () => {},
  ...overrides
});

describe('resolveVariants', () => {
  it('throws when variants is empty', () => {
    expect(() => resolveVariants([])).toThrow('variants must be a non-empty array');
  });

  it('throws when variants is missing', () => {
    expect(() => resolveVariants(undefined as any)).toThrow('variants must be a non-empty array');
  });

  it('throws when multiple variants have no isDefault', () => {
    expect(() => resolveVariants([makeVariant(), makeVariant()]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when multiple variants have more than one isDefault', () => {
    expect(() => resolveVariants([makeVariant({ isDefault: true }), makeVariant({ isDefault: true })]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when the default variant has no generateStartBoard', () => {
    expect(() => resolveVariants([{ botStrategy: () => {} }]))
      .toThrow('the default variant must define generateStartBoard');
  });

  it('uses the single variant as default without requiring isDefault', () => {
    const generateStartBoard = (): Board => [];
    const { defaultVariantIndex } = resolveVariants([makeVariant({ generateStartBoard })]);
    expect(defaultVariantIndex).toBe(0);
  });

  it('picks the variant marked isDefault as the default', () => {
    const generateStartBoard = (): Board => [];
    const variants = [makeVariant(), makeVariant({ isDefault: true, generateStartBoard })];
    const { defaultVariantIndex, defaultVariant } = resolveVariants(variants);
    expect(defaultVariantIndex).toBe(1);
    expect(defaultVariant.generateStartBoard).toBe(generateStartBoard);
  });

  it('fills missing botStrategy from the default variant', () => {
    const defaultBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: defaultBot }),
      makeVariant({ botStrategy: undefined })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[1].botStrategy).toBe(defaultBot);
  });

  it('falls back to first available botStrategy when default has none', () => {
    const otherBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: undefined }),
      makeVariant({ botStrategy: otherBot })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[0].botStrategy).toBe(otherBot);
    expect(resolvedVariants[1].botStrategy).toBe(otherBot);
  });

  it('keeps own botStrategy when defined', () => {
    const ownBot = () => {};
    const defaultBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: defaultBot }),
      makeVariant({ botStrategy: ownBot })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[1].botStrategy).toBe(ownBot);
  });

  it('leaves botStrategy undefined when no variant has one', () => {
    const variants = [makeVariant({ botStrategy: undefined })];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[0].botStrategy).toBeUndefined();
  });
});
