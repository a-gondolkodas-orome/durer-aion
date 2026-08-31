import { useState } from 'react';
import {
  strategyGameFactory,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from 'strategy-game-factory';
import { useTranslation } from 'language';
import {
  allPrimePowers, generateSmallStartBoard, generateStartBoard, moves,
  type Board, type PrimePower
} from './gameplay';

// What the three presentational pieces below all need to judge and dispatch an
// entry. `hoverProps` is read off the hook rather than restated, so it cannot
// drift from it.
interface EntryProps {
  board: Board;
  isEntryAllowed: (entry: PrimePower) => boolean;
  chooseEntry: (entry: PrimePower) => void;
  hoverProps: ReturnType<typeof useHoverPreview<PrimePower>>['hoverProps'];
}
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const PrimePowerButton = (
  { entry, board, isEntryAllowed, chooseEntry, hoverProps }: EntryProps & { entry: PrimePower }
) => {
  const { prime, exponent, value } = entry;
  const isAboveBoard = value > board;
  const isActive = isEntryAllowed(entry);
  return (
    <button
      disabled={!isActive}
      className={`
        border rounded w-10 py-0.5 leading-tight
        ${isAboveBoard ? 'opacity-25' : ''}
        enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900 enabled:hocus:border-blue-300
      `}
      onClick={() => chooseEntry(entry)}
      {...(isActive ? hoverProps(entry) : {})}
    >
      <span className="block text-xs text-slate-500" aria-hidden={exponent <= 1}>
        {exponent > 1 ? <>{prime}<sup>{exponent}</sup></> : <>&nbsp;</>}
      </span>
      <span className="block">{value}</span>
    </button>
  );
};

const PrimePowerGrid = (
  { board, visiblePowers, isEntryAllowed, chooseEntry, hoverProps }:
    EntryProps & { visiblePowers: PrimePower[] }
) => {
  return (
    <div className="flex flex-wrap gap-1 items-end">
      {visiblePowers.map(entry => (
        <PrimePowerButton
          key={`${entry.prime}-${entry.exponent}`}
          entry={entry}
          board={board}
          isEntryAllowed={isEntryAllowed}
          chooseEntry={chooseEntry}
          hoverProps={hoverProps}
        />
      ))}
    </div>
  );
};

const HoverPreview = (
  { hovered, board, isEntryAllowed }:
    Pick<EntryProps, 'board' | 'isEntryAllowed'> & { hovered: PrimePower | null }
) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-6 mb-2">
      {hovered !== null && isEntryAllowed(hovered) && <p>
        {t({ hu: 'Kivonandó prímhatvány:', en: 'Prime power to subtract:' })}{' '}
        <strong>{hovered.prime}<sup>{hovered.exponent}</sup> = {hovered.value}</strong>.{' '}
        {t({ hu: 'Eredmény:', en: 'Result:' })}{' '}
        <strong>{board - hovered.value}</strong>.
      </p>}
    </div>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: hovered, hoverProps } = useHoverPreview<PrimePower>(ctx.moveCount);
  const [visiblePowers] = useState(() => allPrimePowers.filter(e => e.value <= board));
  const isEntryAllowed = (entry: PrimePower) =>
    moves.subtractPrimeExponent.isAllowed(board, entry);

  const chooseEntry = ({ prime, exponent }: PrimePower) => {
    moves.subtractPrimeExponent(board, { prime, exponent });
  };

  return (
    <GameBoard>
      <p className='w-full text-8xl font-bold text-center mb-4'>{board}</p>
      <HoverPreview hovered={hovered} board={board} isEntryAllowed={isEntryAllowed} />
      <PrimePowerGrid
        board={board}
        visiblePowers={visiblePowers}
        isEntryAllowed={isEntryAllowed}
        chooseEntry={chooseEntry}
        hoverProps={hoverProps}
      />
    </GameBoard>
  );
};

const getPlayerStepDescription = () => ({
  hu: 'Válassz egy prímhatványt amit kivonsz.',
  en: 'Choose a prime power to subtract.'
});

const rule = {
  hu: <>
    Egy 1000-nél kisebb, (gép által meghatározott) pozitív egész számtól kezdődik a játék,
    ebből a játékosok felváltva vonnak le egy tetszőleges
    prímhatványt. Az nyer, aki a nullát mondja!
  </>,
  en: <>
    The game starts from a positive integer less than 1000 (chosen by the computer). Players take
    turns subtracting any prime power. The player who reaches zero wins!
  </>
};

export const PrimeExponentials = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateSmallStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
