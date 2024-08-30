import React, { useState } from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn } from './strategy';
import { SharkSvg } from './shark-chase-shark-svg';
import { SubmarineSvg } from './shark-chase-submarine-svg';


export const generateStartBoard = () => {
  return {
    submarines: [0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    shark: 12,
    turn: 1
  };
}

const distance = (fieldA, fieldB) => {
  if (fieldA === null || fieldB === null) return null;
  return (
    Math.abs((fieldA % 4) - (fieldB % 4)) +
    Math.abs(Math.floor(fieldA / 4) - Math.floor(fieldB / 4))
  );
};

const GameBoard = ({ board, setBoard, ctx }) => {
  const [chosenPiece, setChosenPiece] = useState(null);

  let possibleMoves=[]
  if (ctx.shouldPlayerMoveNext) {
    if (ctx.playerIndex === 1) {
      possibleMoves = range(16).filter(i => distance(board.shark, i) <= 1)
    } else if (ctx.turnStage === 'movePiece') {
      possibleMoves = range(16).filter(i => distance(chosenPiece, i) === 1)
    }
  }

  const isAllowed_choosePiece = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (ctx.playerIndex === 0) return board.submarines[id] >= 1;
    if (ctx.playerIndex === 1) return board.shark === id;
  }

  const isAllowed_movePiece = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (ctx.playerIndex === 0) return distance(chosenPiece, id) === 1;
    if (ctx.playerIndex === 1) return distance(board.shark, id) <= 1;
  }

  const clickField = (id) => {
    if (ctx.playerIndex === 0) {
      if (ctx.turnStage === 'choosePiece') {
        if (!isAllowed_choosePiece(id)) return;
        setChosenPiece(id)
        ctx.setTurnStage('movePiece');
      } else if (ctx.turnStage === 'movePiece') {
        if (!isAllowed_movePiece(id)) {
          if (id === chosenPiece) {
            ctx.setTurnStage('choosePiece');
            setChosenPiece(null);
          }
          return;
        };
        const nextBoard = cloneDeep(board);
        nextBoard.submarines[chosenPiece] -= 1;
        nextBoard.submarines[id] += 1;
        nextBoard.turn += 1;
        setChosenPiece(null);
        ctx.setTurnStage('choosePiece');
        ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
      }
    }
    if (ctx.playerIndex === 1) {
      if (!isAllowed_movePiece(id)) return;
      const nextBoard = cloneDeep(board);
      nextBoard.shark = id;
      if (ctx.turnStage !== 'secondSharkMove') {
        if (nextBoard.submarines[id] >= 1) {
          // instant lose
          ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
          return;
        }
        if (id !== board.shark) {
          setBoard(nextBoard);
          ctx.setTurnStage('secondSharkMove');
          return;
        }
      }

      nextBoard.turn += 1;
      setChosenPiece(null);
      ctx.setTurnStage('firstSharkMove');
      ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
    }
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <p className='font-bold text-lg'>Hátralévő lépések száma: {12-board.turn}</p>
    <SubmarineSvg/>
    <SharkSvg/>
    <div className="grid grid-cols-4 gap-0 border-2">
      {range(16).map(id => (
        <button
          key={id}
          onClick={() => clickField(id)}
          disabled={!isAllowed_choosePiece(id) && !isAllowed_movePiece(id)}
          className={`
            aspect-square p-[0%] border-2 relative flex justify-center items-center
            ${possibleMoves.includes(id) && ctx.playerIndex === 1 && board.submarines[id] && 'border-red-600'}
          `}
        >
          {possibleMoves.includes(id) && ctx.playerIndex === 0 && (
            <OptionalNextSubmarine existingSubmarineCount={board.submarines[id]} />
          )}
          {possibleMoves.includes(id) && ctx.playerIndex === 1 && (
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
          {board.shark === id && ctx.playerIndex === 1 && ctx.shouldPlayerMoveNext && (
            <span
              className="absolute z-50 w-[75%] text-black border-2 rounded bg-white opacity-80"
            >Itt maradok</span>
          )}
      </button>
      ))}
    </div>
  </section>
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
  </>;
};

const rule = <>
  Kutatók a Dürerencicás-tóban felfedezték a kihalófélben lévő egyenesenmozgó macskacápa faj
  egy nőstény példányát. Az állat a víz mélyén mozog, így
  befogásához három tengeralattjárót használnak. A kutatók kommunikálnak egymással
  és látják a cápát, továbbá a cápa is látja a kutatókat. A tó négyzet alakú és
  fel van osztva 4 × 4 darab négyzet alakú szektorra. Minden nap délben az egyik
  tengeralattjáró átúszik egy oldalszomszédos szektorba. A cápa 11 nap múlva nyugodt
  körülmények között tenné le a tojását, így addig menekülni próbál, ehhez minden
  éjszaka legfeljebb kétszer átúszik egy oldalszomszédos szektorba. A kutatók az első
  nap az alábbi kezdőhelyzetből mozognak először. A kutatók akkor nyernek, ha a 11.
  napig valamikor egy tengeralattjáró egy szektorba kerül a cápával, míg a cápa akkor
  nyer, ha még a 11. nap végén is szabad.<br></br>
  Ti dönthetitek el, hogy a kutatók vagy a cápa bőrébe szeretnétek bújni.
  <br></br>Sok sikert! :)
</>;

const getPlayerStepDescription = ({ playerIndex, turnStage }) => {
  if (playerIndex === 0) {
    return 'Válassz ki egy tengeralattjárót, majd válassz egy szomszédos szektort.'
  }
  return <>Válassz ki egy cápával oldalszomszédos szektort. Kattints a cápára,
    ha helyben szeretnél maradni.
    <br />
    Ebben a lépésben még legfeljebb <b>{turnStage === 'firstSharkMove' ? 'kétszer' : 'egyszer'} </b>
    úszhatsz át egy szomszédos szektorba.
  </>;
};

const Game = strategyGameFactory({
  rule,
  title: 'Cápa üldözés',
  firstRoleLabel: 'Kutató leszek!',
  secondRoleLabel: 'Cápa leszek!',
  initialTurnStages: ['choosePiece', 'firstSharkMove'],
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const SharkChase = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
