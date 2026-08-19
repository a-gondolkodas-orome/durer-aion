import { cloneDeep, sample } from 'lodash';
import type { VariantInput } from './types';

// Everything downstream only ever sees the generator, so `startBoards` is the
// declarative form of `generateStartBoard`, not a second channel.
//
// The pick is cloned to keep the guarantee every game is already written
// against: a start board is freshly owned by the match it starts. The list is
// module-scope data shared by every match, so without the clone one in-place
// write — which nothing here can detect — would corrupt every later game
// started from that entry, and hand one object to every team of a competition.
const startBoardGenerator = <TBoard,>({ generateStartBoard, startBoards }: VariantInput<TBoard>) => {
  if (generateStartBoard) return generateStartBoard;
  if (!startBoards) return undefined;
  return () => cloneDeep(sample(startBoards)!);
};

// The board a competition hands a team for its Nth attempt at a game: the
// curated list in declaration order, staying on the last board once attempts
// outlast it — the designers' ramp ends there, and cycling back would hand out
// an easier board the team already beat (the old stones game clamped the same
// way). Deterministic on purpose — every team's attempt N gets the same board — and
// the list's append-only contract (src/components/CLAUDE.md § Curated start
// boards) is what makes the index stable: appending entries never changes what
// an earlier index meant, while reordering silently would.
//
// Cloned for the same reason resolveVariants clones its picks: the list is
// module-scope data shared by every match, and one in-place write would hand a
// corrupted board to every later attempt.
export const startBoardForAttempt = <TBoard,>(startBoards: TBoard[], attemptIndex: number): TBoard => {
  if (!startBoards || startBoards.length === 0) {
    throw new Error('startBoardForAttempt: startBoards must be a non-empty array');
  }
  if (!Number.isInteger(attemptIndex) || attemptIndex < 0) {
    throw new Error(`startBoardForAttempt: attemptIndex must be a non-negative integer, got ${attemptIndex}`);
  }
  return cloneDeep(startBoards[Math.min(attemptIndex, startBoards.length - 1)]!);
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
