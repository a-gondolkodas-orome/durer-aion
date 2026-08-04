import { useState } from 'react';
import {
  strategyGameFactory,
  type BotStrategy,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from '../../../strategy-game-factory';
import { sample } from 'lodash';
import { useTranslation } from '../../../../language';
import {
  allPrimePowers,
  generateSmallStartBoard,
  generateStartBoard,
  moves,
  type Board,
  type Moves
} from './gameplay';

const PrimePowerButton = ({ entry, board, isEntryAllowed, chooseEntry, hoverProps }) => {
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

const PrimePowerGrid = ({ board, visiblePowers, isEntryAllowed, chooseEntry, hoverProps }) => {
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

const HoverPreview = ({ hovered, board, isEntryAllowed }) => {
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
  const { value: hovered, hoverProps } = useHoverPreview<typeof allPrimePowers[0]>(ctx.moveCount);
  const [visiblePowers] = useState(() => allPrimePowers.filter(e => e.value <= board));
  const isEntryAllowed = (entry: typeof allPrimePowers[0]) =>
    moves.subtractPrimeExponent.isAllowed(board, entry);

  const chooseEntry = ({ prime, exponent }) => {
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

type Bot = BotStrategy<Board, Moves>

const randomBotStrategy: Bot = ({ board }) => {
  const validMoves = allPrimePowers.filter(e => e.value <= board);
  const { prime, exponent } = sample(validMoves)!;
  return { move: 'subtractPrimeExponent', args: [{ prime, exponent }] };
};

const smartBotStrategy: Bot = ({ board }) => {
  if (board === 1) {
    return { move: 'subtractPrimeExponent', args: [{ prime: 2, exponent: 0 }] };
  }

  const validMoves = allPrimePowers.filter(({ value }) => value <= board);

  let chosenPrime;
  let chosenExponent;

  if (board % 6 === 0) {
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(validMoves)!);
  } else {
    const possibleMoves = validMoves.filter(({ value }) => (board - value) % 6 === 0);
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(possibleMoves)!);
  }
  return { move: 'subtractPrimeExponent', args: [{ prime: chosenPrime, exponent: chosenExponent }] };
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
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
