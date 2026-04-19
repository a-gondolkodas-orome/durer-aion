import React, { useState } from 'react';
import { range } from 'lodash';
import { SharkSvg } from '../assets/shark-chase-shark-svg';
import { SubmarineSvg } from '../assets/shark-chase-submarine-svg';
import { useTranslation } from '../../../language/translate';

export const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();
  const [chosenPiece, setChosenPiece] = useState(null);
  const isCurrentPlayerResearcher = ctx.currentPlayer === 0;
  const isCurrentPlayerShark = ctx.currentPlayer === 1;

  let possibleMoves=[]
  if (ctx.isClientMoveAllowed) {
    if (isCurrentPlayerShark) {
      possibleMoves = range(25).filter(i => distance(board.shark, i) <= 1)
    } else if (chosenPiece !== null) {
      possibleMoves = range(25).filter(i => distance(chosenPiece, i) === 1)
    }
  }

  const isAllowed_choosePiece = (id) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCurrentPlayerResearcher) return board.submarines[id] >= 1;
    if (isCurrentPlayerShark) return board.shark === id;
  }

  const isAllowed_movePiece = (id) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCurrentPlayerResearcher) return distance(chosenPiece, id) === 1;
    if (isCurrentPlayerShark) return distance(board.shark, id) <= 1;
  }

  const clickField = (id) => {
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
  <section className="p-2 shrink-0 grow basis-2/3">
    <p className='font-bold text-lg'>{t({ hu: 'Hátralévő lépések száma', en: 'Remaining moves' })}: {16-board.turn}</p>
    <SubmarineSvg/>
    <SharkSvg/>
    <div className="grid grid-cols-5 gap-0 border-2">
      {range(25).map(id => (
        <button
          key={id}
          onClick={() => clickField(id)}
          disabled={!isAllowed_choosePiece(id) && !isAllowed_movePiece(id)}
          className={`
            aspect-square p-[0%] border-2 relative flex justify-center items-center
            ${possibleMoves.includes(id) && isCurrentPlayerShark && board.submarines[id] && 'border-red-600'}
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
  </section>
  );
};

const distance = (fieldA, fieldB) => {
  if (fieldA === null || fieldB === null) return null;
  return (
    Math.abs((fieldA % 5) - (fieldB % 5)) +
    Math.abs(Math.floor(fieldA / 5) - Math.floor(fieldB / 5))
  );
};

const OptionalNextShark = () => {
  return <svg className="aspect-square top-0 absolute z-40 opacity-50">
    <use xlinkHref="#shark" />
  </svg>;
};

const OptionalNextSubmarine = ({ existingSubmarineCount }) => {
  return <>
    {(existingSubmarineCount === 1) && (
      <svg className="aspect-square top-[10%] absolute z-40 opacity-50">
        <use xlinkHref="#submarine" />
      </svg>
    )}
    {(existingSubmarineCount !== 1) && (
      <svg className="aspect-square top-0 absolute z-40 opacity-50">
        <use xlinkHref="#submarine" />
      </svg>
    )}
  </>;
};

const SubmarinesInCell = ({ count }) => {
  return <>
    {count === 1 && (
      <svg className="aspect-square top-0 absolute z-20 opacity-80">
        <use xlinkHref="#submarine" />
      </svg>
    )}
    {count === 2 && (
      <>
        <svg className="aspect-square top-[-10%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-[10%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
      </>
    )}
    {count === 3 && (
      <>
        <svg className="aspect-square top-[-10%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-0 absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-[10%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
      </>
    )}
    {count === 4 && (
      <>
        <svg className="aspect-square top-[-15%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-[-5%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-[5%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
        <svg className="aspect-square top-[15%] absolute z-20 opacity-80">
          <use xlinkHref="#submarine" />
        </svg>
      </>
    )}
  </>;
};
