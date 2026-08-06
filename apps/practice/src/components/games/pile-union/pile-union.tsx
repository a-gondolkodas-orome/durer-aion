import { useState, type ComponentProps } from 'react';
import { range, random } from 'lodash';
import { strategyGameFactory, type BoardClientProps, GameBoard, useHoverPreview } from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { moves, type Board, type MoveType, type TurnState } from './gameplay';

const BoardClient = ({ board, ctx, setTurnState, moves }: BoardClientProps<Board>) => {
  const [moveType, setMoveType] = useState<MoveType>('remove');
  const { value: hoveredPile, hoverProps } = useHoverPreview<number>(ctx.moveCount);
  const turnState = ctx.turnState as TurnState;

  // The merge branch is a two-click sequence held in turn state, so this one
  // keeps its guard: without it a click during the bot's turn would still move
  // the selection around.
  const handlePileClick = (pileIndex) => {
    if (!ctx.isClientMoveAllowed) return;
    if (moveType === 'remove') {
      moves.removeOne(board, pileIndex);
    } else {
      if (turnState === null) {
        setTurnState({ firstSelectedPile: pileIndex });
      } else if (turnState.firstSelectedPile === pileIndex) {
        setTurnState(null);
      } else {
        moves.mergePiles(board, [turnState.firstSelectedPile, pileIndex]);
        setTurnState(null);
        setMoveType('remove');
      }
    }
  };

  return (
    <GameBoard>
      {board.length > 0 && (
        <MoveTypeSelector
          moveType={moveType}
          isClientMoveAllowed={ctx.isClientMoveAllowed}
          // any two distinct piles may merge, so the first pair answers whether
          // merging is on offer at all
          canMerge={moves.mergePiles.isAllowed(board, [0, 1])}
          onSelect={(type) => { setMoveType(type); setTurnState(null); }}
        />
      )}

      <div className="flex flex-wrap gap-4 items-end">
        {board.map((size, pileIndex) => (
          <Pile
            key={pileIndex}
            size={size}
            disabled={!ctx.isClientMoveAllowed}
            isSelected={moveType === 'merge' && turnState?.firstSelectedPile === pileIndex}
            moveType={moveType}
            onClick={() => handlePileClick(pileIndex)}
            hovered={hoveredPile === pileIndex}
            hoverProps={ctx.isClientMoveAllowed ? hoverProps(pileIndex) : {}}
          />
        ))}
      </div>

    </GameBoard>
  );
};

const MoveTypeSelector = ({ moveType, isClientMoveAllowed, canMerge, onSelect }: {
  moveType: MoveType
  isClientMoveAllowed: boolean
  canMerge: boolean
  onSelect: (type: MoveType) => void
}) => {
  const { t } = useTranslation();

  const labelClass = (active: boolean, disabled: boolean) => `
    grow py-1 px-2 text-center
    ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
    ${active ? 'bg-blue-500 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700'}
    ${!active && !disabled ? 'hocus:bg-slate-200 dark:hocus:bg-slate-600' : ''}
  `;

  return (
    <fieldset
      className="mb-4 max-w-[40ch]"
      disabled={!isClientMoveAllowed}
    >
      <div
        className={`
          flex divide-x divide-slate-300 rounded-lg overflow-hidden border text-sm
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

const Pile = ({ size, disabled, isSelected, moveType, onClick, hovered, hoverProps }: {
  size: number
  disabled: boolean
  isSelected: boolean
  moveType: MoveType
  onClick: () => void
  hovered: boolean
  hoverProps: ComponentProps<'button'>
}) => {
  const isRemoveHovered = moveType === 'remove' && hovered;
  const isMergeHovered = moveType === 'merge' && hovered;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      {...hoverProps}
      className={`
        flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors
        ${isSelected ? 'border-blue-300 bg-blue-600/40' :
          isRemoveHovered ?  'bg-slate-900/5 dark:bg-white/5' :
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

const Matchstick = ({ dimmed }: { dimmed: boolean }) => (
  <div
    className={`w-3 h-14 flex flex-col items-center ${dimmed ? 'opacity-40' : ''}`}
    style={{ transform: 'scaleY(-1)' }}
  >
    <div className="w-2 h-3 bg-red-800 rounded-sm" />
    <div className="w-1.5 grow bg-stone-400" />
  </div>
);

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

export const PileUnion = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => {
        const numPiles = random(2, 4);
        return Array.from({ length: numPiles }, () => random(2, 5));
      },
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
