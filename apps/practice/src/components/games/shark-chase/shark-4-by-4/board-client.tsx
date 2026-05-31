import { useState } from 'react';
import { range } from 'lodash';

import { SharkSvg } from '../assets/shark-chase-shark-svg';
import { SubmarineSvg } from '../assets/shark-chase-submarine-svg';
import { useTranslation } from '../../../language';
import { type Board } from './shark-chase';
import { GameBoard, type BoardClientProps } from '../../../game-factory';

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [chosenPiece, setChosenPiece] = useState<number | null>(null);
  const isCurrentPlayerResearcher = ctx.currentPlayer === 0;
  const isCurrentPlayerShark = ctx.currentPlayer === 1;

  let possibleMoves: number[] = [];
  if (ctx.isClientMoveAllowed) {
    if (isCurrentPlayerShark) {
      possibleMoves = range(16).filter(i => distance(board.shark, i) <= 1);
    } else if (chosenPiece !== null) {
      possibleMoves = range(16).filter(i => distance(chosenPiece, i) === 1);
    }
  }

  const isAllowed_choosePiece = (id: number): boolean => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCurrentPlayerResearcher) return board.submarines[id] >= 1;
    if (isCurrentPlayerShark) return board.shark === id;
    return false;
  };

  const isAllowed_movePiece = (id: number): boolean => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCurrentPlayerResearcher) return chosenPiece !== null && distance(chosenPiece, id) === 1;
    if (isCurrentPlayerShark) return distance(board.shark, id) <= 1;
    return false;
  };

  const clickField = (id: number) => {
    if (!ctx.isClientMoveAllowed) return;
    if (isCurrentPlayerResearcher) {
      if (chosenPiece === null) {
        if (!isAllowed_choosePiece(id)) return;
        setChosenPiece(id)
      } else {
        if (!isAllowed_movePiece(id)) {
          if (id === chosenPiece) {
            setChosenPiece(null);
          }
          return;
        };
        moves.moveSubmarine(board, { from: chosenPiece, to: id });
        setChosenPiece(null);
      }
    }
    if (isCurrentPlayerShark) {
      if (!isAllowed_movePiece(id)) return;
      moves.moveShark(board, id);
    }
  };

  return (
  <GameBoard>
    <p className='font-bold text-lg'>{t({ hu: 'Hátralévő lépések száma', en: 'Remaining moves' })}: {12-board.turn}</p>
    <SubmarineSvg/>
    <SharkSvg/>
    <div className="grid grid-cols-4 border-t-2 border-l-2">
      {range(16).map(id => (
        <button
          key={id}
          onClick={() => clickField(id)}
          disabled={!isAllowed_choosePiece(id) && !isAllowed_movePiece(id)}
          className={`
            aspect-square border-r-2 border-b-2 relative flex justify-center items-center
            disabled:cursor-default
            ${possibleMoves.includes(id) && isCurrentPlayerShark && board.submarines[id]
              ? 'ring-2 ring-inset ring-red-600' : ''}
          `}
        >
          {possibleMoves.includes(id) && isCurrentPlayerResearcher && (
            <OptionalNextSubmarine existingSubmarineCount={board.submarines[id]} />
          )}
          {possibleMoves.includes(id) && isCurrentPlayerShark && (
            <OptionalNextShark />
          )}
          {board.submarines[id] >= 1 && (
            <SubmarinesInCell count={board.submarines[id]} />
          )}
          {board.shark === id && (
            <svg className="aspect-square top-0 absolute z-10 opacity-80">
              <use xlinkHref="#shark" />
            </svg>
          )}
          {board.shark === id && isCurrentPlayerShark && ctx.isClientMoveAllowed && (
            <span
              className="absolute z-50 w-[75%] text-black border-2 rounded-sm bg-white opacity-80"
            >{t({ hu: 'Itt maradok', en: 'Stay here' })}</span>
          )}
      </button>
      ))}
    </div>
  </GameBoard>
  );
};

const distance = (fieldA: number, fieldB: number): number => {
  return (
    Math.abs((fieldA % 4) - (fieldB % 4)) +
    Math.abs(Math.floor(fieldA / 4) - Math.floor(fieldB / 4))
  );
};

const OptionalNextShark = () => {
  return <svg className="aspect-square top-0 absolute z-40 opacity-50">
    <use xlinkHref="#shark" />
  </svg>;
};

const OptionalNextSubmarine = ({ existingSubmarineCount }) => (
  <svg className={`aspect-square absolute z-40 opacity-50 ${existingSubmarineCount === 1 ? 'top-[10%]' : 'top-0'}`}>
    <use xlinkHref="#submarine" />
  </svg>
);

const topsByCount: Record<number, string[]> = {
  1: ['top-0'],
  2: ['top-[-10%]', 'top-[10%]'],
  3: ['top-[-10%]', 'top-0', 'top-[10%]']
};

const SubmarinesInCell = ({ count }) => (
  <>
    {(topsByCount[count] ?? []).map(pos => (
      <svg key={pos} className={`aspect-square ${pos} absolute z-20 opacity-80`}>
        <use xlinkHref="#submarine" />
      </svg>
    ))}
  </>
);
