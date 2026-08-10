import { cloneDeep, sample } from 'lodash';
import type { VariantInput } from '../types';

// A variant states its start position either as a generator or as a curated
// list, and everything downstream only ever sees the generator — `startBoards`
// is the declarative form of `generateStartBoard`, not a second channel.
//
// The pick is cloned so that a generator built from a list keeps the guarantee
// every game is already written against: a start board is freshly owned by the
// match it starts. Nothing mutates one today, but the list is module-scope data
// shared by every match, so without the clone one in-place write — which
// nothing here can detect — would silently corrupt every later game started
// from that entry, and hand one object to every team of a competition.
const startBoardGenerator = <TBoard,>({ generateStartBoard, startBoards }: VariantInput<TBoard>) => {
  if (generateStartBoard) return generateStartBoard;
  if (!startBoards) return undefined;
  return () => cloneDeep(sample(startBoards)!);
};

// How a variant is named in the URL. The index fallback keeps every variant
// addressable without making `id` a field each game has to fill in; what it
// cannot survive is that game's variants being reordered.
export const variantKey = <TBoard,>({ id }: VariantInput<TBoard>, index: number): string =>
  id ?? String(index);

export const resolveVariants = <TBoard,>(variants: VariantInput<TBoard>[]) => {
  if (!variants || variants.length === 0) {
    throw new Error('strategyGameFactory: variants must be a non-empty array');
  }
  if (variants.length > 1 && variants.filter(v => v.isDefault).length !== 1) {
    throw new Error('strategyGameFactory: exactly one variant must have isDefault: true');
  }
  // Checked on the keys rather than the ids, so a declared id that shadows
  // another variant's index fallback is caught too.
  const keys = variants.map((variant, index) => variantKey(variant, index));
  if (new Set(keys).size !== keys.length) {
    throw new Error('strategyGameFactory: variant ids must be unique');
  }
  variants.forEach(({ generateStartBoard, startBoards }) => {
    if (generateStartBoard && startBoards) {
      throw new Error('strategyGameFactory: a variant defines generateStartBoard or startBoards, not both');
    }
    if (startBoards && startBoards.length === 0) {
      throw new Error('strategyGameFactory: startBoards must be a non-empty array');
    }
  });
  const defaultVariantIndex = Math.max(variants.findIndex(v => v.isDefault), 0);
  const startBoardGenerators = variants.map(variant => startBoardGenerator(variant));
  if (!startBoardGenerators[defaultVariantIndex]) {
    throw new Error('strategyGameFactory: the default variant must define generateStartBoard or startBoards');
  }
  const fallbackBotStrategy = variants[defaultVariantIndex].botStrategy
    ?? variants.find(v => v.botStrategy)?.botStrategy;
  // `startBoards` is dropped rather than carried through: resolving normalises
  // every variant to one start-board channel, and the resolved array is what
  // `Game.variants` exposes — which `plays-to-an-end.spec.ts` resolves a second
  // time, so resolution has to be a no-op on its own output. The curated list
  // stays readable where a server would take it from anyway: the game's own
  // React-free module.
  const resolvedVariants = variants.map(({ startBoards: _startBoards, ...variant }, index) => ({
    ...variant,
    botStrategy: variant.botStrategy ?? fallbackBotStrategy,
    generateStartBoard: startBoardGenerators[index]
  }));
  return { defaultVariantIndex, defaultVariant: resolvedVariants[defaultVariantIndex], resolvedVariants };
};
