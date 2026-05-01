import React, { useState } from 'react';
import { range, random } from 'lodash';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { gameList } from '../gameList';
import { useTranslation } from '../../language/translate';
import { aiBotStrategy, randomBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, events, moves }) => {
  const [moveType, setMoveType] = useState('remove');

  const handlePileClick = (pileIndex) => {
    if (!ctx.isClientMoveAllowed) return;
    if (moveType === 'remove') {
      moves.removeOne(board, pileIndex);
    } else {
      if (ctx.turnState === null) {
        events.setTurnState({ firstSelectedPile: pileIndex });
      } else if (ctx.turnState.firstSelectedPile === pileIndex) {
        events.setTurnState(null);
      } else {
        moves.mergePiles(board, [ctx.turnState.firstSelectedPile, pileIndex]);
        events.setTurnState(null);
        setMoveType('remove');
      }
    }
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      {board.length > 0 && (
        <MoveTypeSelector
          moveType={moveType}
          isClientMoveAllowed={ctx.isClientMoveAllowed}
          canMerge={board.length >= 2}
          onSelect={(type) => { setMoveType(type); events.setTurnState(null); }}
        />
      )}

      <div className="flex flex-wrap gap-4 items-end">
        {board.map((size, pileIndex) => (
          <Pile
            key={pileIndex}
            size={size}
            disabled={!ctx.isClientMoveAllowed}
            isSelected={moveType === 'merge' && ctx.turnState?.firstSelectedPile === pileIndex}
            moveType={moveType}
            onClick={() => handlePileClick(pileIndex)}
          />
        ))}
      </div>

    </section>
  );
};

const MoveTypeSelector = ({ moveType, isClientMoveAllowed, canMerge, onSelect }) => {
  const { t } = useTranslation();

  const labelClass = (active, disabled) => `grow py-1 px-2 text-center ${
    active ? 'bg-blue-500 text-white font-semibold cursor-pointer'
    : disabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-600'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
  }`;

  return (
    <fieldset
      className="mb-4 max-w-[40ch]"
      disabled={!isClientMoveAllowed}
    >
      <div
        className={`
          flex rounded-lg overflow-hidden border border-slate-300 text-sm
          has-focus-visible:ring-2 has-focus-visible:ring-red-400 has-focus-visible:ring-offset-1
        `}>
        <label
          className={labelClass(moveType === 'remove' && isClientMoveAllowed, !isClientMoveAllowed)}
        >
          <input
            type="radio"
            className="sr-only"
            checked={moveType === 'remove'}
            onChange={() => onSelect('remove')}
          />
          {t({ hu: 'Elveszek 1-et', en: 'Remove 1' })}
        </label>
        <div className="w-px bg-slate-300" />
        <label
          className={labelClass(moveType === 'merge' && isClientMoveAllowed, !isClientMoveAllowed || !canMerge)}
        >
          <input
            type="radio"
            className="sr-only"
            checked={moveType === 'merge'}
            onChange={() => onSelect('merge')}
            disabled={!canMerge}
          />
          {t({ hu: 'Egyesítek', en: 'Merge' })}
        </label>
      </div>
    </fieldset>
  );
};

const Pile = ({ size, disabled, isSelected, moveType, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isRemoveHovered = moveType === 'remove' && hovered;
  const isMergeHovered = moveType === 'merge' && hovered;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`
        flex flex-col items-center gap-1 p-2 rounded border-2 transition-colors
        ${isSelected ? 'border-blue-300 bg-blue-600/40' :
          isRemoveHovered ? 'border-slate-200 bg-slate-800/5' :
          isMergeHovered ? 'border-blue-300 bg-blue-600/20' :
          'border-transparent'}
        disabled:cursor-default
      `}
    >
      <div
        className="flex flex-col gap-0.5 items-center"
        style={{ transform: 'scaleY(-1)' }}
      >
        {range(Math.ceil(size / 5)).map(row => (
          <div key={row} className="flex gap-0.5">
            {range(Math.min(5, size - row * 5)).map(col => {
              const isLastMatch = row * 5 + col === size - 1;
              return (
                <Matchstick
                  key={col}
                  dimmed={isRemoveHovered && isLastMatch}
                />
              );
            })}
          </div>
        ))}
      </div>
      <span className="text-lg font-bold">{size}</span>
    </button>
  );
};

const Matchstick = ({ dimmed }) => (
  <div
    className={`w-3 h-14 flex flex-col items-center ${dimmed ? 'opacity-40' : ''}`}
    style={{ transform: 'scaleY(-1)' }}
  >
    <div className="w-2 h-3 bg-red-800 rounded-sm" />
    <div className="w-1.5 grow bg-stone-400" />
  </div>
);

const moves = {
  removeOne: (board, { events }, pileIndex) => {
    const newSize = board[pileIndex] - 1;
    const nextBoard = [
      ...board.slice(0, pileIndex),
      ...(newSize > 0 ? [newSize] : []),
      ...board.slice(pileIndex + 1)
    ];
    events.endTurn();
    if (nextBoard.length === 0) events.endGame();
    return { nextBoard };
  },
  mergePiles: (board, { events }, [pileIndex1, pileIndex2]) => {
    const [firstIdx, secondIdx] = [pileIndex1, pileIndex2].sort((a, b) => a - b);
    const merged = board[firstIdx] + board[secondIdx];
    const nextBoard = board.filter((_, i) => i !== firstIdx && i !== secondIdx);
    nextBoard.splice(firstIdx, 0, merged);
    events.endTurn();
    return { nextBoard };
  }
};

const getPlayerStepDescription = ({ board, ctx }) => {
  if (ctx.turnState !== null) {
    return {
      hu: 'Kattints egy másik kupacra az egyesítéshez, vagy ugyanerre a kupacra a kijelölés visszavonásához.',
      en: 'Click another pile to merge, or the same pile again to deselect.'
    };
  }
  if (board.length === 1) {
    return {
      hu: 'Vegyél el egy gyufát a kupacból.',
      en: 'Remove 1 match from the pile.'
    };
  }
  return {
    hu: 'Vegyél el 1 gyufát egy kupacból, vagy egyesíts két kupacot.',
    en: 'Remove 1 match from a pile, or merge two piles into one.'
  };
};

const rule = {
  hu: <>
    A játék kezdetén néhány kupac gyufa van az asztalon, mindegyikben legalább két szál.
    A játékosok felváltva lépnek, kétféle lépés megengedett: vagy egyetlen gyufát elveszünk valamelyik
    kupacból, vagy egyesítünk két kupacot. Az veszít, aki nem tud szabályosan lépni.
  </>,
  en: <>
    At the start of the game, several piles of matches are placed on the table, each containing
    at least two matches. Players alternate turns. Two moves are allowed: either remove one match
    from a pile, or merge two piles into one. The player who cannot make a legal move loses.
  </>
};

const { name, title, credit } = gameList.PileUnion;
export const PileUnion = strategyGameFactory({
  presentation: {
    rule,
    title: title || name,
    credit,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    {
      botStrategy: aiBotStrategy,
      generateStartBoard: () => {
        const numPiles = random(2, 4);
        return Array.from({ length: numPiles }, () => random(2, 5));
      },
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
