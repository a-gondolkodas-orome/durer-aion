import { resolveVariants } from './resolve-variants';
import type { VariantInput } from '../types';

type Board = string[];

const makeVariant = (overrides: VariantInput<Board> = {}) => ({
  generateStartBoard: (): Board => [],
  botStrategy: () => [],
  ...overrides
});

describe('resolveVariants', () => {
  it('throws when variants is empty', () => {
    expect(() => resolveVariants([])).toThrow('variants must be a non-empty array');
  });

  it('throws when multiple variants have no isDefault', () => {
    expect(() => resolveVariants([makeVariant(), makeVariant()]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when multiple variants have more than one isDefault', () => {
    expect(() => resolveVariants([makeVariant({ isDefault: true }), makeVariant({ isDefault: true })]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when the default variant has neither generateStartBoard nor startBoards', () => {
    expect(() => resolveVariants([{ botStrategy: () => [] }]))
      .toThrow('the default variant must define generateStartBoard or startBoards');
  });

  it('throws when a variant defines both generateStartBoard and startBoards', () => {
    expect(() => resolveVariants([makeVariant({ startBoards: [['a']] })]))
      .toThrow('a variant defines generateStartBoard or startBoards, not both');
  });

  it('throws when two variants share an id', () => {
    const variants = [
      makeVariant({ id: 'full', isDefault: true }),
      makeVariant({ id: 'full' })
    ];
    expect(() => resolveVariants(variants)).toThrow('variant ids must be unique');
  });

  // Without an id a variant is addressed by its index, so an id that reads as
  // another variant's index would make `?variant=` ambiguous.
  it('throws when an id shadows another variant\'s index', () => {
    const variants = [makeVariant({ isDefault: true }), makeVariant({ id: '0' })];
    expect(() => resolveVariants(variants)).toThrow('variant ids must be unique');
  });

  it('throws when startBoards is empty', () => {
    expect(() => resolveVariants([{ botStrategy: () => [], startBoards: [] }]))
      .toThrow('startBoards must be a non-empty array');
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
    const defaultBot = () => [];
    const variants = [
      makeVariant({ isDefault: true, botStrategy: defaultBot }),
      makeVariant({ botStrategy: undefined })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[1].botStrategy).toBe(defaultBot);
  });

  it('falls back to first available botStrategy when default has none', () => {
    const otherBot = () => [];
    const variants = [
      makeVariant({ isDefault: true, botStrategy: undefined }),
      makeVariant({ botStrategy: otherBot })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[0].botStrategy).toBe(otherBot);
    expect(resolvedVariants[1].botStrategy).toBe(otherBot);
  });

  it('keeps own botStrategy when defined', () => {
    const ownBot = () => [];
    const defaultBot = () => [];
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

  describe('startBoards', () => {
    const curated: Board[] = [['a'], ['b'], ['c']];

    it('derives a generator that only ever returns a curated board', () => {
      const { resolvedVariants } = resolveVariants([{ botStrategy: () => [], startBoards: curated }]);
      for (let i = 0; i < 30; i++) {
        expect(curated).toContainEqual(resolvedVariants[0].generateStartBoard!());
      }
    });

    it('reaches every curated board', () => {
      const { defaultVariant } = resolveVariants([{ botStrategy: () => [], startBoards: curated }]);
      const seen = new Set(Array.from({ length: 100 }, () => defaultVariant.generateStartBoard!()[0]));
      expect([...seen].sort()).toEqual(['a', 'b', 'c']);
    });

    // A generated start board has always been freshly owned by its match; a
    // curated one has to be too, or a single in-place write would outlive the
    // game that made it.
    it('hands out a copy, never the curated board itself', () => {
      const { defaultVariant } = resolveVariants([{ botStrategy: () => [], startBoards: curated }]);
      const board = defaultVariant.generateStartBoard!();
      board.push('mutated');
      expect(curated.flat()).toEqual(['a', 'b', 'c']);
    });

    // `Game.variants` is the resolved array, and the catalog sweep resolves it
    // again — so resolving twice has to mean the same as resolving once.
    it('survives being resolved a second time', () => {
      const { resolvedVariants } = resolveVariants([{ botStrategy: () => [], startBoards: curated }]);
      expect(() => resolveVariants(resolvedVariants)).not.toThrow();
      const { defaultVariant } = resolveVariants(resolvedVariants);
      expect(curated).toContainEqual(defaultVariant.generateStartBoard!());
    });

    it('satisfies the default variant requirement on its own', () => {
      const variants = [
        makeVariant(),
        { isDefault: true, botStrategy: () => [], startBoards: curated }
      ];
      expect(() => resolveVariants(variants)).not.toThrow();
    });
  });
});
