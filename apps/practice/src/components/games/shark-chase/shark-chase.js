import React, { useState } from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn, playerColor } from './strategy/strategy';
import { SharkSvg } from './strategy/shark-chase-shark-svg';
import { SubmarineSvg } from './strategy/shark-chase-submarine-svg';


export const generateStartBoard = () => {
  startboard = Array(16).fill(null);
  startboard[2] = 'red';
  startboard[3] = 'red';
  startboard[7] = 'red';
  startboard[12] = 'blue';
  return {board: startboard, shark: 12, turn: 1};
}


const GameBoard = ({ board, setBoard, ctx }) => {
  const [playerState, setPlayerState] = useState('choosePiece');
  const [chosenPiece, setChosenPiece] = useState(12);

  possibleMoves=[]
  if (ctx.playerIndex===1) {
    for (let i = 0; i < 16; i++) {
      if ((Math.abs(board.shark%4-i%4) + Math.abs(Math.floor(board.shark/4)-Math.floor(i/4)))<=2 && board.board[i]!=='blue' && board.board[i]!=='red')
      {
        possibleMoves.push(i);
      }
    }
  }
  else if (ctx.playerIndex===0 && playerState === 'movePiece') {
    for (let i = 0; i < 16; i++) {
      if ((Math.abs(chosenPiece%4-i%4) + Math.abs(Math.floor(chosenPiece/4)-Math.floor(i/4)))<=1 && board.board[i]!=='red'  && board.board[i]!=='blue')
      {
        possibleMoves.push(i);
      }
    }
  }


  const distanceFromChosenPiece = (id) => {
    return Math.abs(chosenPiece%4-id%4) + Math.abs(Math.floor(chosenPiece/4)-Math.floor(id/4));
  }

  const isAllowed_choosePiece = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return board.board[id] === playerColor(ctx.playerIndex);
  }
  const isAllowed_movePiece = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (board.board[id] === 'red') return false;
    if (ctx.playerIndex === 0) return distanceFromChosenPiece(id) <=1;
    else return distanceFromChosenPiece(id) <=2;
  }

  const clickField = (id) => {
    if (playerState === 'choosePiece' && ctx.playerIndex === 0)
    {
      if (!isAllowed_choosePiece(id)) return;
      setPlayerState('movePiece');
      setChosenPiece(id);
    }
    else if (ctx.playerIndex === 1 || playerState === 'movePiece')
    {
      if (board.board[id]==='red' && ctx.playerIndex === 0){
        setChosenPiece(id);
      }
      else if (!isAllowed_movePiece(id)) return;
      else{
        const newBoard = cloneDeep(board);
        newBoard.board[chosenPiece] = null;
        newBoard.board[id] = playerColor(ctx.playerIndex);
        newBoard.turn = board.turn+1;
              if (ctx.playerIndex === 1) newBoard.shark = id;
        if (ctx.playerIndex === 0 && board.shark === id)
        {
          newBoard.shark = -1;
        }
        setPlayerState('choosePiece');
        setChosenPiece(id);
        ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
      }
    }


  };
  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <b><font size="4">Hátralévő lépések száma: {12-board.turn}</font></b>
    <SubmarineSvg/>
    <SharkSvg/>
    <div className="grid grid-cols-4 gap-0 border-2">
      {range(16).map(id => (
        <button
          key={id}
          onClick={() => clickField(id)}
          className="aspect-square p-[0%] border-2"
        > {(possibleMoves.includes(id) && ctx.playerIndex===0) && (
            <span>
            <svg className="w-full aspect-square opacity-30 inline-block">
              <use xlinkHref="#submarine" />
            </svg>
            </span>
          )}
         {(ctx.shouldPlayerMoveNext && possibleMoves.includes(id) && ctx.playerIndex===1 && board.shark!=-1) && (
            <span>
            <svg className="w-full aspect-square opacity-30 inline-block">
              <use xlinkHref="#shark" />
            </svg>
            </span>
          )}
          {board.board[id]==='red' && (
            <span>
            <svg className="w-full aspect-square inline-block">
              <use xlinkHref="#submarine" />
            </svg>
            </span>
          )}
          {board.board[id]==='blue' && (
            <span>
            <svg className="w-full aspect-square inline-block">
              <use xlinkHref="#shark" />
            </svg>
            </span>

          )}

      </button>
      ))}
    </div>
  </section>
  );
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

const Game = strategyGameFactory({
  rule,
  title: 'Cápa üldözés',
  firstRoleLabel: 'Kutató leszek!',
  secondRoleLabel: 'Cápa leszek!',
  GameBoard,
  G: {
    getPlayerStepDescription: (data) =>
    {
      if (data.playerIndex === 0)
      {
        return 'Válassz ki egy tengeralattjárót, majd válassz egy szomszédos mezőt.';
      }
      else
      {
        return 'Válassz ki a cápától egy maximum 2 távolságra lévő mezőt.';
      }
    },

    generateNewBoard: generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const SharkChase = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
