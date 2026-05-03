import React, { useState } from 'react';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { sample, random } from 'lodash';
import { useTranslation } from '../../language/translate';

const primeList = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
];

const allPrimePowers = (() => {
  const entries = [{ prime: 2, exponent: 0, value: 1 }];
  for (const p of primeList) {
    for (let e = 1; p ** e < 1000; e++) {
      entries.push({ prime: p, exponent: e, value: p ** e });
    }
  }
  return entries.sort((a, b) => a.value - b.value);
})();

const generateStartBoard = () => {
  if (random(0, 1)) {
    return random(3, 166) * 6;
  } else {
    return random(3, 166) * 6 + random(1, 5);
  }
};

const generateSmallStartBoard = () => random(12, 72);

const PrimePowerButton = ({ entry, board, isClientMoveAllowed, chooseEntry, setHovered }) => {
  const { prime, exponent, value } = entry;
  const isAboveBoard = value > board;
  const isActive = !isAboveBoard && isClientMoveAllowed;
  return (
    <button
      className={`border rounded w-10 py-0.5 text-center leading-tight border-gray-300
        ${isAboveBoard ? 'opacity-25' : ''}
        ${isActive ? 'hover:bg-blue-100 hover:border-blue-300 cursor-pointer' : ''}`}
      onClick={() => isActive && chooseEntry(entry)}
      onMouseOver={() => isActive && setHovered(entry)}
      onMouseOut={() => setHovered(null)}
      onFocus={() => isActive && setHovered(entry)}
      onBlur={() => setHovered(null)}
    >
      <span className="block text-xs text-gray-500" aria-hidden={exponent <= 1}>
        {exponent > 1 ? <>{prime}<sup>{exponent}</sup></> : <>&nbsp;</>}
      </span>
      <span className="block">{value}</span>
    </button>
  );
};

const PrimePowerGrid = ({ board, visiblePowers, isClientMoveAllowed, chooseEntry, setHovered }) => {
  return (
    <div className="flex flex-wrap gap-1 items-end">
      {visiblePowers.map(entry => (
        <PrimePowerButton
          key={`${entry.prime}-${entry.exponent}`}
          entry={entry}
          board={board}
          isClientMoveAllowed={isClientMoveAllowed}
          chooseEntry={chooseEntry}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
};

const HoverPreview = ({ hovered, board }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-6 mb-2">
      {hovered !== null && <p>
        {t({ hu: 'Kivonandó prímhatvány:', en: 'Prime power to subtract:' })}{' '}
        <strong>{hovered.prime}<sup>{hovered.exponent}</sup> = {hovered.value}</strong>.{' '}
        {t({ hu: 'Eredmény:', en: 'Result:' })}{' '}
        <strong>{board - hovered.value}</strong>.
      </p>}
    </div>
  );
};

const BoardClient = ({ board, ctx, moves }) => {
  const [hovered, setHovered] = useState(null);
  const [visiblePowers] = useState(() => allPrimePowers.filter(e => e.value <= board));

  const chooseEntry = ({ prime, exponent }) => {
    moves.subtractPrimeExponent(board, { prime, exponent });
  };

  return (
    <section className='p-2 shrink-0 grow basis-2/3'>
      <p className='w-full text-8xl font-bold text-center'>{board}</p><br />
      <HoverPreview hovered={hovered} board={board} />
      <PrimePowerGrid
        board={board}
        visiblePowers={visiblePowers}
        isClientMoveAllowed={ctx.isClientMoveAllowed}
        chooseEntry={chooseEntry}
        setHovered={setHovered}
      />
    </section>
  );
};

const randomBotStrategy = ({ board, moves }) => {
  const validMoves = allPrimePowers.filter(e => e.value <= board);
  const { prime, exponent } = sample(validMoves);
  moves.subtractPrimeExponent(board, { prime, exponent });
};

const aiBotStrategy = ({ board, moves }) => {
  if (board === 1) {
    moves.subtractPrimeExponent(board, { prime: 2, exponent: 0 });
    return;
  }

  const validMoves = allPrimePowers.filter(({ value }) => value <= board);

  let chosenPrime;
  let chosenExponent;

  if (board % 6 === 0) {
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(validMoves));
  } else {
    const possibleMoves = validMoves.filter(({ value }) => (board - value) % 6 === 0);
    ({ prime: chosenPrime, exponent: chosenExponent } = sample(possibleMoves));
  }
  moves.subtractPrimeExponent(board, { prime: chosenPrime, exponent: chosenExponent });
  return;
};

const getPlayerStepDescription = () => ({
  hu: 'Válassz egy prímhatványt amit kivonsz.',
  en: 'Choose a prime power to subtract.'
});

const moves = {
  subtractPrimeExponent: (board, { events }, { prime, exponent }) => {
    const nextBoard = board - prime ** exponent;
    events.endTurn();
    if (nextBoard === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};

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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      botStrategy: aiBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
